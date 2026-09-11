"""Isolated HTTP integration fixture: real admin service, in-memory new-api substitute."""
from __future__ import annotations

import asyncio
import copy
import tempfile
import time
from pathlib import Path

from fastapi import Request
from admin_api.app import Runtime, create_app
from admin_api.config import Settings
from admin_api.database import Database
from admin_api.domain import credential_fingerprint, identity_hash
from admin_api.monitor import Monitor
from admin_api.new_api import NewApiError
from admin_api.repository import Repository
from admin_api.service import AdminService
from test_routing import FakeNewApi, metadata
from support import test_vault, encrypted_config


class BrowserClient(FakeNewApi):
    fail_once = False

    async def verify_root(self, authorization: str):
        if authorization != 'Bearer root-token':
            raise NewApiError('Root required', 403)
        return {'id': 1, 'username': 'root', 'role': 100}

    async def close(self):
        pass

    async def get_groups(self, token: str):
        return ['plus', 'empty', 'other', 'long-group-with-a-very-long-name-for-layout-verification']

    async def batch_status(self, token, channel_ids, status):
        await asyncio.sleep(0.3)
        if self.fail_once:
            self.fail_once = False
            raise NewApiError('模拟上游临时故障')
        return await super().batch_status(token, channel_ids, status)


class BrowserService(AdminService):
    async def bootstrap(self, authorization):
        value = await super().bootstrap(authorization)
        for channel in value['channels']:
            if channel['id'] == 'lc_7':
                channel['state'] = 'unready'
            channel['latest_model_results'] = [{'model_id': model, 'name': model, 'status': ['available', 'unavailable', 'untested', 'running'][index % 4]} for index, model in enumerate(channel['models'])]
        return value


temp = tempfile.TemporaryDirectory(prefix='partokens-route-e2e-')
settings = Settings.from_mapping({'PARTOKENS_ADMIN_NEW_API_ORIGIN': 'http://unused.test', 'PARTOKENS_ADMIN_DATABASE_PATH': str(Path(temp.name) / 'admin.sqlite3')})
database = Database(settings.database_path)
database.initialize()
repository = Repository(database, test_vault())
client = BrowserClient()
monitor = Monitor(settings, repository, client)
service = BrowserService(repository, client, monitor)
app = create_app(settings, Runtime(settings, database, repository, client, monitor, service))


@app.api_route('/api/{path:path}', methods=['GET', 'POST'])
async def fixture_auth(path: str):
    user = {'id': 1, 'username': 'isolated-root', 'display_name': 'Isolated Root', 'role': 100,
            'email': 'root@example.test', 'group': 'default', 'quota': 0, 'used_quota': 0, 'setting': '{}'}
    if path in {'user/auth/refresh', 'user/login'}:
        timestamp = int(time.time())
        return {'success': True, 'data': {'access_token': 'root-token', 'token_type': 'Bearer',
            'access_expires_at': timestamp + 3600, 'user': user,
            'session': {'sid': '10000000-0000-4000-8000-000000000042', 'current': True,
                        'login_method': 'password', 'ip': '127.0.0.1', 'user_agent': 'isolated-test',
                        'created_at': timestamp, 'last_active_at': timestamp, 'expires_at': timestamp + 86400}}}
    if path == 'user/self':
        return {'success': True, 'data': user}
    if path == 'status':
        return {'success': True, 'data': {'system_name': 'Partokens', 'password_login_enabled': True,
            'register_enabled': False, 'email_verification_enabled': False, 'turnstile_check': False}}
    return {'success': True, 'data': []}


@app.post('/__test/reset')
async def reset():
    for table in ['changes', 'change_migrations', 'execution_creations', 'route_configs', 'physical_records', 'logical_channels', 'monitor_snapshots']:
        database.execute(f'DELETE FROM {table}')
    client.channels = {}
    client.next_id = 100
    client.fail_once = False
    for index, name in enumerate(['渠道 A', '渠道 B', '渠道 C', '渠道 D', '停用渠道', '无模型渠道', 'long-channel-name-' * 4, '未就绪渠道']):
        logical_id = f'lc_{index}'
        models = [] if index == 5 else ['gpt-4o', 'legacy', 'untested-model', 'running-model'] if index == 0 else [f'long-model-name-{number:03d}' for number in range(160)] if index == 6 else ['gpt-4o']
        fingerprint = credential_fingerprint(logical_id)
        repository.create_logical({'id': logical_id, 'name': name, 'channel_type': 1, 'base_url': 'https://example.test/v1', 'identity_hash': identity_hash(1, f'https://example.test/{index}', fingerprint), 'credential_fingerprint': fingerprint, 'cost_ratio': None if index == 6 else 0.123, 'models': models, 'note': '', 'config_ciphertext': encrypted_config(logical_id, logical_id)})
        if index == 4:
            repository.update_logical(logical_id, {'enabled': False})
    for group in ['plus', 'other']:
        layers = [{'priority': 1234, 'members': [{'logical_id': 'lc_0', 'weight': 50}, {'logical_id': 'lc_1', 'weight': 100}]}, {'priority': 789, 'members': [{'logical_id': 'lc_2', 'weight': 100}, {'logical_id': 'lc_3', 'weight': 100}, {'logical_id': 'lc_6', 'weight': 100}]}] if group == 'plus' else [{'priority': 1000, 'members': [{'logical_id': 'lc_0', 'weight': 100}]}]
        repository.save_route(group, 1, {'layers': layers}, 'fixture')
        for attempt, layer in enumerate(layers):
            for member in layer['members']:
                record = repository.channel_config(member['logical_id'])
                record.update(id=client.next_id, name=repository.logical_row(member['logical_id'])['name'], tag=f"ptlc:{member['logical_id']}", group=group, status=1, priority=layer['priority'], weight=member['weight'], other_info=metadata(member['logical_id'], 'route', group=group, attempt=attempt, priority=layer['priority'], weight=member['weight'], route_revision=1, config_version=1))
                client.channels[client.next_id] = record
                client.next_id += 1
    await monitor.refresh('Bearer root-token', include_logs=False)
    return {'ok': True}


@app.post('/__test/control')
async def control(request: Request):
    payload = await request.json()
    if payload.get('fail_once'):
        client.fail_once = True
    if payload.get('conflict'):
        route = repository.route('plus')
        repository.save_route('plus', route['revision'] + 1, route['config'], 'external-admin')
    if payload.get('nonstandard'):
        client.channels[900] = {'id': 900, 'name': '旧版共享渠道', 'group': 'empty,other', 'status': 1, 'models': 'gpt-4o'}
        client.channels[901] = {'id': 901, 'name': '其他分组旧渠道', 'group': 'other', 'status': 2, 'models': 'gpt-4o'}
    return {'ok': True}
