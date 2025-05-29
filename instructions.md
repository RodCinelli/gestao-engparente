# 📋 Instruções de Instalação - Sistema de Gestão Empresarial

Este documento contém todas as instruções necessárias para configurar e executar o projeto em um novo computador.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### 1. Python (Backend)
- **Versão**: Python 3.8 ou superior
- **Download**: [python.org](https://www.python.org/downloads/)
- **Verificar instalação**: 
  ```bash
  python --version
  pip --version
  ```

### 2. Node.js (Frontend)
- **Versão**: Node.js 18 ou superior
- **Download**: [nodejs.org](https://nodejs.org/)
- **Verificar instalação**:
  ```bash
  node --version
  npm --version
  ```

### 3. Git
- **Download**: [git-scm.com](https://git-scm.com/)
- **Verificar instalação**:
  ```bash
  git --version
  ```

### 4. PostgreSQL (Opcional para produção)
- **Download**: [postgresql.org](https://www.postgresql.org/download/)
- Para desenvolvimento local, o SQLite será usado automaticamente

---

## 🚀 Configuração do Projeto

### Passo 1: Obter o Código do Projeto

#### Opção A: Clonar do Git (se disponível)
```bash
git clone [URL_DO_REPOSITORIO]
cd gestao-engparente
```

#### Opção B: Copiar arquivos manualmente
1. Copie toda a pasta do projeto para o novo computador
2. Abra o terminal/prompt na pasta do projeto

### Passo 2: Configuração do Backend (Django)

1. **Navegue para a pasta do backend**:
   ```bash
   cd backend
   ```

2. **Crie um ambiente virtual**:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```
   
   Se o arquivo `requirements.txt` não existir, instale manualmente:
   ```bash
   pip install django
   pip install djangorestframework
   pip install django-allauth
   pip install psycopg2-binary
   pip install django-cors-headers
   pip install channels
   pip install channels_redis
   pip install gunicorn
   pip install python-decouple
   pip install django-filter
   ```

4. **Configure as variáveis de ambiente**:
   
   Copie o arquivo de exemplo e configure:
   ```bash
   # Windows
   copy env.example .env
   
   # Linux/Mac  
   cp env.example .env
   ```
   
   Edite o arquivo `.env` criado com suas configurações:
   ```env
   DEBUG=True
   SECRET_KEY=django-insecure-sua-chave-secreta-aqui
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Para desenvolvimento local (SQLite)
   DATABASE_URL=sqlite:///db.sqlite3
   
   # Para PostgreSQL (opcional)
   # DATABASE_URL=postgres://usuario:senha@localhost:5432/nome_do_banco
   
   # CORS
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. **Execute as migrações do banco de dados**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Crie um superusuário (opcional)**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Teste o backend**:
   ```bash
   python manage.py runserver
   ```
   O backend estará disponível em: `http://localhost:8000`

### Passo 3: Configuração do Frontend (Next.js)

1. **Abra um novo terminal** e navegue para a pasta do frontend:
   ```bash
   cd frontend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```
   
   Se houver problemas, tente:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure as variáveis de ambiente**:
   
   Copie o arquivo de exemplo e configure:
   ```bash
   # Windows
   copy env.local.example .env.local
   
   # Linux/Mac
   cp env.local.example .env.local
   ```
   
   Edite o arquivo `.env.local` criado:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Instale o Tailwind CSS** (se necessário):
   ```bash
   npx tailwindcss init -p
   ```

5. **Configure o shadcn/ui** (se necessário):
   ```bash
   npx shadcn@latest init
   ```
   Quando perguntado, use as configurações padrão.

6. **Instale componentes do shadcn** (se necessário):
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add card
   npx shadcn@latest add input
   npx shadcn@latest add badge
   npx shadcn@latest add toast
   npx shadcn@latest add dialog
   npx shadcn@latest add form
   npx shadcn@latest add select
   npx shadcn@latest add tabs
   ```

7. **Teste o frontend**:
   ```bash
   npm run dev
   ```
   O frontend estará disponível em: `http://localhost:3000`

---

## 🎯 Executando o Projeto Completo

### Para Desenvolvimento Local:

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   python manage.py runserver
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acesse a aplicação**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - Admin Django: `http://localhost:8000/admin`

---

## 🔧 Estrutura do Projeto

```
gestao-engparente/
├── backend/                 # Django API
│   ├── manage.py
│   ├── requirements.txt
│   ├── env.example         # Exemplo de configuração (.env)
│   ├── .env               # Configurações locais (criar manualmente)
│   ├── employees/          # App principal
│   └── gestao_api/         # Configurações Django
├── frontend/               # Next.js App
│   ├── package.json
│   ├── env.local.example   # Exemplo de configuração (.env.local)
│   ├── .env.local         # Configurações locais (criar manualmente)
│   ├── app/               # Páginas Next.js
│   ├── components/        # Componentes React
│   └── lib/              # Utilitários
└── instructions.md        # Este arquivo
```

---

## 🛠️ Comandos Úteis

### Backend (Django)
```bash
# Ativar ambiente virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar nova dependência
pip install nome-do-pacote
pip freeze > requirements.txt

# Migrações
python manage.py makemigrations
python manage.py migrate

# Executar servidor
python manage.py runserver

# Shell Django
python manage.py shell

# Verificar projeto
python manage.py check
```

### Frontend (Next.js)
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Adicionar componentes shadcn
npx shadcn@latest add [componente]

# Instalar nova dependência
npm install nome-do-pacote
```

---

## 🐛 Problemas Comuns e Soluções

### 1. Erro de CORS
**Problema**: Frontend não consegue acessar o backend
**Solução**: Verifique se o `CORS_ALLOWED_ORIGINS` no backend inclui a URL do frontend

### 2. Erro de Migração
**Problema**: Erro ao executar `python manage.py migrate`
**Solução**: 
```bash
python manage.py makemigrations employees
python manage.py migrate
```

### 3. Porta em uso
**Problema**: "Port already in use"
**Solução**:
```bash
# Para backend (porta 8000)
python manage.py runserver 8001

# Para frontend (porta 3000)
npm run dev -- -p 3001
```

### 4. Dependências não instaladas
**Problema**: Módulos não encontrados
**Solução**:
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install --legacy-peer-deps
```

### 5. Problemas com shadcn/ui
**Problema**: Componentes não funcionam
**Solução**:
```bash
npx shadcn@latest init
# Escolha as configurações padrão
```

---

## 🌐 Deploy para Produção

### Backend (Railway/Heroku)
1. Configure as variáveis de ambiente de produção
2. Use PostgreSQL em produção
3. Configure `ALLOWED_HOSTS` adequadamente
4. Use `gunicorn` como servidor WSGI

### Frontend (Vercel/Netlify)
1. Conecte o repositório Git
2. Configure a variável `NEXT_PUBLIC_API_URL` para a URL da API em produção
3. Build automático será executado

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os pré-requisitos estão instalados
2. Confirme se as portas 3000 e 8000 estão livres
3. Verifique se os ambientes virtuais estão ativados
4. Consulte os logs de erro detalhadamente

**Versões testadas**:
- Python: 3.11+
- Node.js: 18+
- Django: 4.2+
- Next.js: 14+

---

## 📝 Notas Importantes

1. **Sempre ative o ambiente virtual** antes de trabalhar com o backend
2. **Mantenha as dependências atualizadas** nos arquivos `requirements.txt` e `package.json`
3. **Não commite arquivos `.env`** - eles contêm informações sensíveis
4. **Use SQLite para desenvolvimento** e PostgreSQL para produção
5. **Teste ambos os serviços** antes de fazer deploy

**Bom desenvolvimento! 🚀** 