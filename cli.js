#!/usr/bin/env node

var args = require("minimist")(process.argv);
var util = require("util");
var path = require('path');
//npm -i ea-logsqlite --save 
var LogSqlite = require("./lib/logsqlite"); 

var basedir = process.env["EA_LOGSQLITE_PATH"] || process.env["HOME"] || process.env["USERPROFILE"] || __dirname;

async function cli(args){
    var dbpath = dbname => { dbname=dbname||"ea-log"; return path.resolve(`${basedir}/${dbname}.sqlite`).toString(); };
    var channel = args["c"]||args["channel"]||"cli";
    var dbfile = args["f"]||args["file"]||dbpath();
    var text = "";
    
    var db = new LogSqlite(dbfile);
    await db.connect();
    if(args.s) {
        return db.find(args.s,channel);
    } else if(args.p) {
        text +=  await pipeIn();
    } else {
        
        if(args._.length>2) { 
            text += args._.splice(2).join(" ")+"\r\n";
        } 
           
    }
    if(text.length<=0 && !args.s) {
        throw Error("USAGE: A) echo hello world | log -p  B) log hello world C) log -s \"hello AND world\"");
    } else {
        db.write(text,channel);
        return text;
    }
}
//cli(args).then(console.log).catch(e=>console.log("[ERROR]", util.inspect(e.message||e)));
cli(args).then(console.log).catch(e=>{
    process.stderr.write(e.message);
    process.exit(1);
});


async function pipeIn(stream) {
	return new Promise((resolve, reject) => {
		stream = stream || process.stdin;
		var iniString = "" 
		var rn = "\r\n";
		var hr = "-".repeat(79);
		stream.setEncoding("utf8"); 
		stream.on("readable", function(){
			var next = stream.read();
			if(next && next != "null")
				iniString += next;
		}); 
		stream.on("end", function(data) {
			//console.log(data,rn,hr,rn);
			//iniString += data;
			//console.log(iniString);
			//var obj = require("ini").parse(iniString);
			resolve(iniString);
		});	
	});
}





/*
var file = __dirname+"./temp.sqlite"; 

var log = {
    A: new LogSqlite(__dirname+"./server-A.sqlite"),
    B: new LogSqlite(__dirname+"./server-B.sqlite")
};
http://hagb4rd.gizmore.org/

//write(text, [tag])
log.A.write("hello world!");

//search("word OR (another AND onemore)", [tag])
log.A.find("hello").then(console.log).catch(console.log);




*/

