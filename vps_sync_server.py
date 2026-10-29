#!/usr/bin/env python3
"""
Micro-Servidor de Sincronización Privada para Finanzas Hogar (Diego & Soledad)
Diseñado para correr en tu VPS 24/7 sin dependencias externas (usa solo Python standard library).

Uso:
  python vps_sync_server.py --port 8443 --token tu_token_secreto_aqui

Recomendación de seguridad para VPS de trading:
  - Cambia el TOKEN_SECRET por una clave segura (ej: diego-sole-finanzas-2026-xyz).
  - Si tienes Caddy o Nginx, ponlo detrás de HTTPS para evitar alertas de Mixed Content en navegadores móviles.
"""

import http.server
import socketserver
import json
import os
import argparse
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'finanzas_hogar_db.json')
DEFAULT_PORT = 8443
DEFAULT_TOKEN = 'diego-sole-2026'

class SyncRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _is_authorized(self):
        auth_header = self.headers.get('Authorization', '')
        expected = f'Bearer {self.server.token}'
        if auth_header == expected:
            return True
        # Soporte para token por query param ?token=...
        if '?' in self.path:
            import urllib.parse
            params = urllib.parse.parse_qs(self.path.split('?')[1])
            if params.get('token', [''])[0] == self.server.token:
                return True
        return False

    def do_GET(self):
        clean_path = self.path.split('?')[0]
        if clean_path == '/' or clean_path == '/health':
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'service': 'Finanzas Hogar Diego & Soledad VPS Sync Server',
                'time': datetime.now().isoformat()
            }).encode('utf-8'))
            return

        if clean_path != '/api/sync':
            self.send_response(404)
            self.end_headers()
            return

        if not self._is_authorized():
            self.send_response(401)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'No autorizado. Token inválido.'}).encode('utf-8'))
            return

        if not os.path.exists(DB_FILE):
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'empty': True, 'msg': 'No hay datos guardados aún en el VPS.'}).encode('utf-8'))
            return

        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_POST(self):
        clean_path = self.path.split('?')[0]
        if clean_path != '/api/sync':
            self.send_response(404)
            self.end_headers()
            return

        if not self._is_authorized():
            self.send_response(401)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'No autorizado. Token inválido.'}).encode('utf-8'))
            return

        content_len = int(self.headers.get('Content-Length', 0))
        if content_len == 0:
            self.send_response(400)
            self.end_headers()
            return

        post_body = self.rfile.read(content_len).decode('utf-8')
        try:
            parsed = json.loads(post_body)
            parsed['_vps_saved_at'] = datetime.now().isoformat()
            
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(parsed, f, ensure_ascii=False, indent=2)

            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'msg': 'Datos sincronizados y guardados correctamente en tu VPS',
                'saved_at': parsed['_vps_saved_at']
            }).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

def run_server():
    parser = argparse.ArgumentParser(description="VPS Sync Server para Finanzas Hogar")
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help="Puerto a escuchar (default 8443)")
    parser.add_argument('--token', type=str, default=DEFAULT_TOKEN, help="Token secreto de autenticación")
    args = parser.parse_args()

    class CustomServer(socketserver.ThreadingTCPServer):
        allow_reuse_address = True

    server = CustomServer(('0.0.0.0', args.port), SyncRequestHandler)
    server.token = args.token
    print(f"🚀 VPS Sync Server corriendo en http://0.0.0.0:{args.port}")
    print(f"🔑 Token Secreto configurado: {args.token}")
    print(f"💾 Archivo de base de datos: {DB_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor...")
        server.shutdown()

if __name__ == '__main__':
    run_server()
