#!/bin/bash

# Fungsi untuk setup venv dan install grpc
setup_venv() {
    folder=$1
    echo "🔧 Setting up virtual environment in $folder ..."

    cd "$folder" || exit
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install grpcio grpcio-tools
    deactivate
    cd - > /dev/null || exit
}

# Jalankan fungsi untuk client dan server
setup_venv "SERVICES/python_grpc/client"
setup_venv "SERVICES/python_grpc/server"

echo "✅ Semua selesai! venv + grpcio terinstal di client & server."
