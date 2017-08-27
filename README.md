## ea-logsqlite [*f.u.c.k.u.p*](https://github.com/f-u-c-k-u-p/)
[https://github.com/hagb4rdea-logsqlite.git](https://github.com/hagb4rd/ea-logsqlite.git)

** sqlite-based log-writer **


### Installation
```bash 

#install
npm install -g ea-logsqlite 

#optional: setup path where sqlite file will be stored 
# (if not configured will look a path in the ENVIRONMENT variables HOME or USERPROFILE)
export EA_LOGSQLITE_PATH='/home/user'

#write log via pipe
echo "hello world" | logs -p  

#write log 
logs hello world

#search log
logs -s "hello AND world" 

```


### Install as module
` npm install --save ea-logsqlite `

#### git install
```bash 
git clone https://github.com/hagb4rd/ea-logsqlite.git 
npm install 
```

#### sample use case 
```js

//npm -i ea-logsqlite --save 
var LogSqlite = require("ea-logsqlite"); 

//constructor takes full path to sqlite-file (will try to create one if not found) 
var log = {
    A: new LogSqlite(__dirname+"/server-A.sqlite"),
    B: new LogSqlite(__dirname+"/server-B.sqlite")
};

//write(text, [tag])
log.A.write("hello world!");

//search("word OR (another AND onemore)", [tag])
log.A.find("hello OR world").then(result=>console.log(result)).catch(console.log);

```
##### Output

```json
[ { logs_id: 2,
    time: '2017-08-17 01:06:55',
    channel: 'private',
    text: 'hello world!' } ]
```