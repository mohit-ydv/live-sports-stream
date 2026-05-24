# steps

## setup
npm init -y
npm i express
setup a basic nodejs server
initialize git repo

## lets build db layer:
Q: how and where do we persist data?
Q: how do we rebuild state when a user refreshes?
Q: how do we handle multiple servers?
Q: how do we avoid sending fake or inconsistent data?

- we are using postgress
- goto https://neon.com/docs/guides/drizzle and copy prompt
- generate db schema with AI prompt

## setup coderabbit so that it reviews our PRs

## Matches Rest API
- routes/matches.js
- generate validation file using Zod
- implement a post request to create a new match
- confiure coderabbit for code review in PR

## build the ws layer - so that user dont need to refresh to get new matches added
- install ws library
- create a ws server.js
- attached the ws with nodejs server

## security with ArcJet
- rate limiter
- bot protection
- security layer for https and ws servers
- securtyMiddleware()

### test httpArcjet protection
for i in {1..60}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/matches; done

### ws burst test 
for (let i = 0; i < 10; i++) {
const ws = new WebSocket("ws://localhost:8000/ws");
ws.onopen = () => console.log(`Socket ${i} opened`);
ws.onclose = (e) => console.log(`Socket ${i} closed: ${e.code} ${e.reason}`);
}

- tested the security of both restapis and ws through arcjet shield(block spams, malicous bots protect streams)!!.
