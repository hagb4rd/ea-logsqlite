## ea-logsqlite [*f.u.c.k.u.p*](https://github.com/f-u-c-k-u-p/)
[https://github.com/hagb4rdea-logsqlite.git](https://github.com/hagb4rd/ea-logsqlite.git)

### npm install
` npm install --save ea-logsqlite `

### git install
```bash 
git clone https://github.com/hagb4rd/ea-logsqlite.git 
npm install 
```

### sample use case 
```js

//read args
var text=process.argv.join(" ");

//npm -i ea-logsqlite --save 
var LogSqlite = require("ea-logsqlite"); 

var file = __dirname+"./temp.sqlite"; 

var log = {
    A: new LogSqlite(__dirname+"./server-A.sqlite"),
    B: new LogSqlite(__dirname+"./server-B.sqlite")
};

//write(text, [tag])
log.A.write("hello world!");

//search("word OR (another AND onemore)", [tag])
log.A.find("hello").then(console.log).catch(console.log);

```
#### Output

```json
[ { logs_id: 2,
    time: '2017-08-17 01:06:55',
    channel: 'private',
    text: 'hello world!' } ]
```