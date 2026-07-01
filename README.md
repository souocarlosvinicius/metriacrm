# Metria CRM

**Metria CRM** é um sistema completo de gestão de relacionamento com o cliente (CRM) desenvolvido sob medida para corretores de imóveis autônomos e imobiliárias de médio porte. Projetado com uma interface focada na usabilidade e abordagem mobile-first, ele consolida em uma única tela todas as ferramentas cruciais para a rotina de vendas imobiliárias.

O projeto está em **fase final de beta** e preparado para transição comercial.

---

## 🚀 Funcionalidades Principais

- **Dashboard Comercial Inteligente**: Visão geral de comissões estimadas, taxa de conversão do pipeline, tarefas do dia, visitas agendadas e propostas em análise.
- **Gestão de Imóveis**: Cadastro detalhado de propriedades para Venda, Aluguel ou Temporada, controle de status (Disponível, Reservado, Em Negociação, etc.) e especificações estruturais.
- **Funil de Vendas (Pipeline)**: Kanban interativo estruturado em colunas estratégicas de atendimento (Novo, Em Atendimento, Proposta, Contrato, Ganho e Perdido).
- **Clientes e Leads**: Cadastro unificado de contatos PF/PJ, histórico detalhado de interações (trilha de auditoria) e qualificações específicas.
- **Agenda de Tarefas**: Sistema de follow-up diário por prioridade com assistente de lembretes.
- **Visitas e Propostas**: Módulo para agendar vistorias/visitas físicas, colher feedbacks estruturados e controlar o fluxo financeiro de propostas de compra ou locação.
- **Relatórios**: Gráficos analíticos de distribuição de leads por origem, conversão histórica de vendas e funil de propostas.
- **Modo de Demonstração Isolado**: Permite que usuários e avaliadores conheçam todo o fluxo do sistema com dados fictícios ricos, rodando de forma 100% offline e isolada das tabelas e do banco de dados real.
- **Motor de IA (Gemini)**: Geração automatizada de descrições persuasivas para imóveis (formatos profissional, whatsapp ou portais imobiliários) e recomendação algorítmica de próximas melhores ações comerciais (*Next Best Actions*).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React (v19), TypeScript, Tailwind CSS, Lucide React (ícones), Motion (animações).
- **Backend**: Node.js, Express (API REST), TSX (execução direta de TypeScript no ambiente de dev), Esbuild (empacotamento de produção).
- **Persistência de Dados**: MongoDB Atlas (MongoDB nativo via driver oficial) com fallback inteligente para banco de dados relacional em arquivo JSON local para desenvolvimento fácil.
- **Inteligência Artificial**: SDK oficial `@google/genai` (Gemini Pro/Flash) rodando de forma segura no lado do servidor.

---

## 📋 Variáveis de Ambiente (`.env`)

Para o correto funcionamento em ambientes de desenvolvimento e produção, configure as variáveis de ambiente em um arquivo `.env` no diretório raiz do projeto. Você pode copiar as definições a partir do `.env.example`:

```env
# Define o ambiente de execução (development | production)
NODE_ENV=development

# URL base onde o frontend do projeto está rodando
APP_URL=http://localhost:3000

# Porta de rede reservada para a inicialização do servidor Express
PORT=3000

# Chave secreta da API do Google Gemini para recursos inteligentes de redação e Next Best Actions
GEMINI_API_KEY=

# String de conexão principal do MongoDB Atlas (Necessária em produção)
MONGODB_URI=

# Nome da coleção/banco de dados a ser utilizado dentro do MongoDB Atlas
MONGODB_DB_NAME=metria_crm

# Chave privada para encriptação e assinatura segura dos cookies de sessão
SESSION_SECRET=
```

---

## 📦 Como Instalar e Rodar Localmente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM ou Yarn

### Passo a Passo

1. **Clonar e acessar o repositório**:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd metria-crm
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Certifique-se de preencher `SESSION_SECRET` com uma chave forte de no mínimo 32 caracteres e, opcionalmente, configure o seu `MONGODB_URI`.*

4. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   *O projeto será executado e estará disponível em seu navegador no endereço: [http://localhost:3000](http://localhost:3000)*

5. **Compilar para produção**:
   ```bash
   npm run build
   ```

6. **Iniciar servidor compilado em produção**:
   ```bash
   npm run start
   ```

---

## 🧪 Como Testar o Sistema

### 1. Testando o Modo de Demonstração (Sem Banco de Dados)
- Na tela inicial, clique no botão **"Ver demonstração"**.
- O sistema iniciará imediatamente no **Modo Demonstração**. Um banner dourado persistente no topo indicará esse estado.
- Sinta-se à vontade para navegar pelas abas, registrar novas tarefas, criar leads, adicionar imóveis fictícios, mover leads no Pipeline e rodar os geradores de IA.
- **Importante**: Todas as alterações feitas nesse modo serão armazenadas de forma estrita no seu `localStorage` local sob chaves isoladas de simulação. Nada é enviado para o banco de dados principal.
- Para sair, basta acessar as Configurações ou o topo do perfil e clicar em **"Sair da demonstração"** (ou no botão de Logout), o que limpará os cookies de simulação e restaurará a tela original de boas-vindas.

### 2. Criando uma Conta Real (Com Banco de Dados)
- Na tela inicial, clique em **"Cadastre-se"** ou em **"Começar Agora"** no topo da Landing Page.
- Preencha o Nome Completo, E-mail, Nome Comercial (opcional), CRECI (opcional), Telefone, Usuário e crie uma senha forte.
- Após o cadastro de sucesso, você passará por um fluxo amigável de **Onboarding** para parametrizar seu perfil profissional (cidade de atuação, foco em locação ou vendas, etc.).
- A partir daí, o banco de dados criará uma estrutura de registros 100% vazia vinculada unicamente ao seu ID (`userId`). Qualquer dado que você inserir será armazenado permanentemente no banco real (MongoDB Atlas ou banco local `data/db.json`).

### 3. Testando Login e Validação de Sessão
- Faça logout das suas sessões.
- Tente fazer login usando o Usuário ou E-mail cadastrado e a senha definida.
- Atualize a página do navegador (`F5` ou Recarregar). Note que a sua sessão real será revalidada automaticamente através do cookie HttpOnly seguro do Express em segundo plano (`/api/auth/me`), sem expor credenciais sensíveis no localStorage do navegador.

---

## 🛡️ Camada de Armazenamento e Upload de Imagens

Por padrão, a aplicação armazena os arquivos de imagem enviados na pasta `/uploads` do próprio servidor em disco. O backend realiza verificações de segurança obrigatórias sobre o arquivo:
- **Tamanho Limite**: Máximo de 10MB por foto.
- **Formatos Permitidos**: Apenas arquivos com mime-type seguro (`image/jpeg`, `image/png`, `image/webp`). Extensões executáveis são estritamente rejeitadas.

> 💡 **Nota Comercial**: Para produção real em alta escala, recomenda-se configurar serviços de armazenamento dedicados na nuvem (como Cloudinary, AWS S3, Firebase Storage ou Supabase Storage) alterando o serviço de persistência no backend.
