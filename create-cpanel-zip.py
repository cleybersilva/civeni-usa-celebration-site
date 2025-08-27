#!/usr/bin/env python3
"""
Script alternativo em Python para criar ZIP compatível com cPanel
Use este script se o build-cpanel.sh não funcionar corretamente
"""

import os
import zipfile
import sys
from pathlib import Path

def create_cpanel_zip():
    """Cria um arquivo ZIP compatível com cPanel File Manager"""
    
    dist_path = Path("dist")
    if not dist_path.exists():
        print("❌ Erro: Pasta 'dist' não encontrada!")
        print("💡 Execute 'npm run build' primeiro")
        return False
    
    zip_filename = "civeni-saas-cpanel.zip"
    
    try:
        print("📦 Criando arquivo ZIP compatível com cPanel...")
        
        # Remover ZIP anterior se existir
        if Path(zip_filename).exists():
            os.remove(zip_filename)
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            # Percorrer todos os arquivos na pasta dist
            for root, dirs, files in os.walk(dist_path):
                # Filtrar arquivos desnecessários
                dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__MACOSX__']
                
                for file in files:
                    # Ignorar arquivos ocultos e de sistema
                    if file.startswith('.') or file.endswith('.DS_Store'):
                        continue
                        
                    file_path = Path(root) / file
                    # Caminho relativo dentro do ZIP (sem a pasta 'dist')
                    arc_path = file_path.relative_to(dist_path)
                    
                    print(f"  📄 Adicionando: {arc_path}")
                    zipf.write(file_path, arc_path)
        
        # Verificar se o ZIP foi criado
        if Path(zip_filename).exists():
            file_size = Path(zip_filename).stat().st_size
            print(f"✅ ZIP criado com sucesso: {zip_filename}")
            print(f"📊 Tamanho: {file_size / 1024 / 1024:.1f} MB")
            
            # Testar integridade
            try:
                with zipfile.ZipFile(zip_filename, 'r') as test_zip:
                    test_result = test_zip.testzip()
                    if test_result is None:
                        print("✅ Integridade do ZIP verificada - OK")
                    else:
                        print(f"⚠️ Problema detectado no arquivo: {test_result}")
            except Exception as e:
                print(f"⚠️ Erro ao verificar integridade: {e}")
            
            print("\n📋 Instruções para cPanel:")
            print("1. Acesse File Manager no cPanel")
            print("2. Navegue até public_html/")
            print("3. Upload do arquivo civeni-saas-cpanel.zip")
            print("4. Clique direito no arquivo → Extract")
            print("5. Confirme a extração")
            
            return True
        else:
            print("❌ Erro: Falha ao criar arquivo ZIP")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao criar ZIP: {e}")
        return False

def manual_upload_instructions():
    """Mostra instruções para upload manual"""
    print("\n📋 ALTERNATIVA - Upload Manual:")
    print("1. Abra a pasta 'dist' no seu computador")
    print("2. Selecione TODOS os arquivos e pastas dentro de 'dist'")
    print("3. Acesse File Manager no cPanel")
    print("4. Navegue até public_html/")
    print("5. Faça upload de todos os arquivos selecionados")
    print("6. Aguarde o upload completar")
    print("7. Verifique se a estrutura de pastas foi mantida")

if __name__ == "__main__":
    print("🚀 Script Python para deploy no cPanel - CIVENI SaaS")
    print("=" * 50)
    
    success = create_cpanel_zip()
    
    if not success:
        print("\n💡 Como o ZIP falhou, use o upload manual:")
        manual_upload_instructions()
    
    print("\n🚀 Processo concluído!")