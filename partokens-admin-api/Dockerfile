FROM python:3.13.7-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --requirement requirements.txt

COPY admin_api admin_api

RUN useradd --create-home --uid 10001 partokens \
    && mkdir -p /app/data \
    && chown -R partokens:partokens /app

USER partokens
EXPOSE 8081

CMD ["python", "-m", "admin_api"]

