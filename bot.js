var kkrwallet = require('turtlecoin-walletd-rpc-js').default

var walletd = new kkrwallet(
  'http://localhost',
  8080,
  'password',
  true
)

var fs = require('fs');

// LOAD DATABASE OF OUTGOING WALLETS

let db = {'wallets':[]};

try {
	db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
} catch(err) {}

// LOAD DATABASE OF TIP FUND WALLETS (SERVER RECIEVE)

let bank = {'wallets':[]};

try {
        bank = JSON.parse(fs.readFileSync('bank.json', 'utf8'));
} catch(err) {}



let registerWallet = (user, address) => {

	for ( i in db.wallets ) {
		console.log(db.wallets[i]);

		if (db.wallets[i].user == user) {
			db.wallets.splice(i, 1);
		}

	}

	db.wallets.push({"user":user,"address":address});
	console.log(db.wallets);

	let json = JSON.stringify(db);
	fs.writeFile('db.json',json,'utf8');

}

let getUserWallet = (user) => {

	for ( i in db.wallets ) {
                console.log(db.wallets[i]);

                if (db.wallets[i].user == user) {
                        return db.wallets[i].address;
                }

        }
	
	return false;

}

let getUserBank = (user) => {

        for ( i in bank.wallets ) {
                console.log(bank.wallets[i]);

                if (bank.wallets[i].user == user) {
                        return bank.wallets[i].wallet;
                }

        }

        return false;


}

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {

  if ( msg.content.startsWith('!register') ) {

        command = msg.content.split(' ');
	address = command[1];

	if ( command[2] ) {
		msg.reply('Too many arguments!');
		return;
	}

        if ( address.length != 99 || !address.startsWith('SEKR') ) {
		msg.reply('Sorry, address is invalid.')
		return;
	}

    registerWallet(msg.author.id, address);

    user_bank = getUserBank(msg.author.id);

    if (!user_bank) {
	walletd
          .createAddress()
          .then(resp => {
            console.log(resp.status)
            console.log(resp.headers)
            console.log(resp.body)

            wallet_addr = resp.body.result.address;
            bank.wallets.push({"user":msg.author.id, "wallet":wallet_addr});

	    msg.author.send('Your new address for depositing tip funds is: ' + wallet_addr);

            let json = JSON.stringify(bank);
            fs.writeFile('bank.json',json,'utf8');


          })
          .catch(err => {
            console.log(err)
          })
	}

    msg.reply('Wallet registered! Your tips will be payed out to this account.');

}
  if (msg.content.startsWith('!tip')) { 

	command = msg.content.split(' ');
	receiver = command[1];
	receiver_id = receiver.replace(/[^0-9]/g,'');

	amount = command[2];

        if ( command[3] ) {
                msg.reply('Too many arguments!');
        }

	receiver_wallet = getUserWallet(receiver_id);

	if (!receiver_wallet) {
		client.users.get(receiver_id).send("Hello! You've just been sent a tip, but you don't have a registered wallet. Please use the !register <address> to receive tips.");
	}

	sender_wallet = getUserBank(msg.author.id);


	if(!sender_wallet) {

		msg.author.send("Please use the !register command to obtain a wallet which you can transfer tipping funds to. The command takes one argument, an already existing SEKR address that will be your wallet for receiving tips.");
		return;
	}

	walletd
          .sendTransaction(0,[{"address":receiver_wallet,"amount":parseInt(amount)*100}],10,[sender_wallet])
          .then(resp => {
            console.log(resp.status)
            console.log(resp.headers)
            console.log(resp.body)

            sender_wallet = resp.body.result.address;

	    msg.reply(" just tipped " + receiver + " " + amount + " KKR.");


          })
          .catch(err => {
            console.log(err)
		msg.author.send("Sorry you don't have enough KKR in your wallet. Use !balance for more information.");
          })


}
  if (msg.content.startsWith('!balance') ) {
	user_bank = getUserBank(msg.author.id);
	console.log(user_bank);
	if(!user_bank){
		msg.reply("You don't have a wallet yet! Use !register to get one.");
		return;
	}

	 walletd
          .getBalance(user_bank)
          .then(resp => {
            console.log(resp.status)
            console.log(resp.headers)
            console.log(resp.body)

            balance = resp.body.result.availableBalance / 100;

	    locked = resp.body.result.lockedAmount / 100;

	    msg.author.send("Your current balance is: " + balance + " KKR (" + locked + " pending). To top it up, send more to " + user_bank);

          })
          .catch(err => {
            console.log(err)
          })



}





});

client.login('token');

walletd
  .getStatus()
  .then(resp => {
    console.log(resp.status)
    console.log(resp.headers)
    console.log(resp.body)
  })
  .catch(err => {
    console.log(err)
  })
