import Discord, { Collection, Interaction, Message } from "discord.js"
import dotenv from 'dotenv'
import { Command } from "./Command"
import config from './config'
import CommandManager from "./slashCommands"
import Log from "./utils/logger"
dotenv.config({ path: __dirname + "/.env" })
declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>
    }

    // export interface Command {
    //     name: string
    //     execute(options: CommandExecuteParameters): Promise<void>
    //     data: SlashCommandBuilder
    //     aliases: string[]
    //     usage: string
    //     description: string
    // }
}

let commandManager

// const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
// bot.commands = new Collection()
const bot = new Discord.Client({ intents: ["GUILD_MESSAGES", "GUILDS"] })

// for (const file of commandFiles) {
//     const command = require(path.join(__dirname, 'commands', file)).default as Command
//     bot.commands.set(command.data.name, command)
//     // #TODO command aliases
// }

bot.on("ready", async (): Promise<void> => {
    if (!bot.user) return
    commandManager = new CommandManager(bot)
    Log.info(`Logged in as ${bot.user.tag}`)
    if (bot.user.username != config.bot_name)
        bot.user.setUsername(config.bot_name)
    bot.user.setActivity(config.activity)
})

bot.on('interactionCreate', async (ir: Interaction) => {
    if (!ir.isCommand()) return
    const command = bot.commands.get(ir.commandName)
    if (!command) return
    try {
        command.execute({ type: 'interaction', interaction: ir })
    } catch (err: any) {
        console.log('err: ', err.message)
        await ir.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
})

// bot.on('interactionCreate', (ir: Interaction) => {
//     if(ir.isButton()) console.log(ir)
// })

bot.on('messageCreate', (msg: Message) => {
    if (!msg.content.startsWith(config.prefix)) return
    const args = msg.content.slice(config.prefix.length).split(/ +/)
    const commandName = args.shift()
    const command = bot.commands.get(commandName ?? '')
    if (!command) return
    try {
        command.execute({ message: msg, args, type: 'message' })
    } catch (err: any) {
        Log.error(`messageCreateEvent: ${err.message}`)
        msg.reply({ content: 'There was an error while executing this command!' })
    }
})

bot.login(process.env.BOT_TOKEN)