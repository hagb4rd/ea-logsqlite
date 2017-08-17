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