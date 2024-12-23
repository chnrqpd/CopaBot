require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, ClientApplication } = require ('discord.js');
const connectDB = require('./db');
const executeCommand = require('./utils/commandExecutor');
const logger = require('./config/logger');

const token = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandsFolder = fs.readdirSync(foldersPath);

for (const folder of commandsFolder) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('error', error => {
  logger.error('Erro no cliente Discord:', error);
});

module.exports = {
   name: Events.InteractionCreate,
   async execute(interaction) {
       if (!interaction.isChatInputCommand()) return;
       await executeCommand(interaction);
   },
};

const http = require('http');
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('O bot está rodando!\n');
}).listen(PORT, () => {
    console.log(`Servidor HTTP iniciado na porta ${PORT}`);
});

connectDB();
client.login(token);