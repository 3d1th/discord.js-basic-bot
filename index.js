const { Client, GatewayIntentBits, REST, Routes, Constants,PermissionsBitField } = require('discord.js');
const fs = require('fs');
const readline = require('readline');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildBans] });

let token;
if (!fs.existsSync('token.txt')) {
    console.error('token.txt 파일이 없습니다. 토큰을 해당 파일에 작성해주세요.');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter 키를 누르면 종료됩니다...', () => {
        rl.close();
        process.exit();
    });
    return;  // 로그인 시도를 방지하기 위해 함수나 스크립트의 실행을 여기서 중단합니다.
} else {
    token = fs.readFileSync('token.txt', 'utf8').trim();
}


const commands = [
    {
        name: '밴',
        description: '유저를 밴합니다.',
        options: [
            {
                name: '대상',
                type: 6,  // USER
                description: '밴할 대상의 맨션',
                required: true
            },
            {
                name: '사유',
                type: 3,  // STRING
                description: '밴하는 이유',
                required: false
            }
        ]
    },
    {
        name: '청소',
        description: '메시지를 청소합니다.',
        options: [
            {
                name: '개수',
                type: 4,  // INTEGER
                description: '청소할 메시지의 개수',
                required: true
            }
        ]
    }
];


client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Register commands for all guilds
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});



client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === '밴') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return await interaction.reply('당신은 이 명령어를 사용할 권한이 없습니다.');
        }

        const target = interaction.options.getMember('대상');
        const reason = interaction.options.getString('사유') || '사유 없음';

        try {
            await target.ban({ reason });
            await interaction.reply({ content: `${target.user.tag}을(를) 밴했습니다. 사유: ${reason}` });
        } catch (error) {
            console.error(error);
            await interaction.reply('밴하는 도중 오류가 발생했습니다.');
        }
    } else if (commandName === '청소') {
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            return await interaction.reply('당신은 이 명령어를 사용할 권한이 없습니다.');
        }

        const amount = interaction.options.getInteger('개수');
        if (amount <= 0 || amount > 99) {
            return await interaction.reply('1부터 99 사이의 숫자를 입력해주세요.');
        }

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `${amount}개의 메시지를 삭제했습니다.` });
        } catch (error) {
            console.error(error);
            await interaction.reply('메시지를 삭제하는 도중 오류가 발생했습니다.');
        }
    }
});

client.login(token).catch(error => {
    console.error('Login failed. Check your token.');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Press ENTER to exit...', () => {
        rl.close();
        process.exit();
    });
});