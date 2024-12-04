# Bot de Copa LOL

Um bot do Discord para gerenciar partidas personalizadas de League of Legends, sortear times e manter estatísticas dos jogadores.

## 🎮 Funcionalidades

### Gerenciamento de Partidas
- `/copa` - Inicia uma nova sessão para sorteio de times
  - Permite confirmação de até 10 jogadores
  - Suporta tanto membros do Discord quanto jogadores manuais
  - Sorteia automaticamente dois times equilibrados
  - Gera ID único para cada sessão

### Registro de Resultados
- Botões integrados para declarar o time vencedor
- Comando alternativo `/vencedor` para casos especiais
- Sistema de permissões para controle de declaração de resultados

### Sistema de Estatísticas
- `/estatisticas` - Mostra ranking geral ou estatísticas individuais
  - Visualização detalhada por jogador
  - Sistema de ranking dos top 10 jogadores
  - Métricas incluem:
    - Total de jogos
    - Vitórias/Derrotas
    - Taxa de vitória
 - Infelizmente, para conseguir utilizar as estatisticas automáticas e mais detalhadas é necessário utilizar uma chave de API de produção da Riot Games, e isso é bem complicado de conseguir.

## 🛠️ Tecnologias Utilizadas
- Discord.js
- MongoDB
- Node.js

## 📋 Pré-requisitos
- Node.js v22.12.0 ou superior
- MongoDB
- Token do bot Discord
- Permissões necessárias no servidor Discord

## ⚙️ Configuração

1. Clone o repositório
```bash
git clone [url-do-repositorio]
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente em um arquivo `.env`
```env
DISCORD_TOKEN=seu_token_aqui
MONGODB_URI=sua_uri_mongodb
```

4. Inicie o bot
```bash
npm start
```

## 🔐 Permissões Necessárias
- Bot requer permissão para:
  - Enviar mensagens
  - Gerenciar mensagens
  - Adicionar reações
  - Visualizar canais
  - Usar comandos de aplicativo

## 📝 Comandos

### /copa
Inicia uma nova sessão de copa:
1. Use `/copa` para começar
2. Jogadores podem se juntar:
   - Clicando em "✅ Confirmar"
   - Sendo adicionados manualmente
3. Times são sorteados automaticamente ao atingir 10 jogadores

### /estatisticas
Consulta estatísticas:
- `/estatisticas @usuario` - Mostra estatísticas do jogador
- `/estatisticas` - Mostra ranking geral

### /vencedor (Backup)
Registra manualmente o vencedor:
- `/vencedor [ID da sessão] [time]`
- Requer permissão de gerenciar mensagens

## 👥 Contribuindo
Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de enviar pull requests.

## 📄 Licença
Este projeto está licenciado sob a MIT - veja o arquivo LICENSE para detalhes.

## ✉️ Contato
[Discord: chnrqpd]
