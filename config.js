var config = {
	logFile: "output.log",
	domain: "luuc.me",
	language: "en",
	bots: [{
				username: "luucjp1",
				password: "Luca221199",
				apiKey: "4B8BF49F6959131606DF5B1C2BA8FB2E",
				polldataFile: "polldata/bot1.json",
				sharedSecret: "9SX+BCzZK3b/O5PHib7Oc7gJIaI=",
				identitySecret: "IGbyOzijSaAOPKrme7p5EUCu5P0="
			}],
	admins: [
				'76561198053558238',
				'76561198089535549'
			],
	cancelTime: 180000,
	sessionSecret: "Ah9Ak25R1b7]5V(dHYx&SYv9']WcN$",
	dbHost: "localhost",
	dbPort: 27017,
	dbName: "jackpot",
	roundTime: 120
};

module.exports = config;