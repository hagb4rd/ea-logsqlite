var sqlite3 = require('sqlite3').verbose();

class LogSqlite {  
    constructor(filepath, callback) {
        this.defaultChannel="-";
        this.filepath = filepath || (__dirname + "/logs.sqlite");
        this.db=null;
        this.init().then(db=>(this.db=db,db));
    }
    static create(filepath,callback) {
        filepath = filepath || ":memory:";
        return new Promise((resolve,reject)=>{
            var logs = new LogSqlite(filepath, db=>(callback(db),resolve(db),db));
        });
    }
    init() {
        return new Promise((resolve,reject)=>{
            var db=new sqlite3.Database(this.filepath,(sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE));
            db.on("open", ()=>{ 
                db.serialize(function(){
                    db.run(`
                        CREATE TABLE IF NOT EXISTS logs (
                            logs_id INTEGER PRIMARY KEY ASC,
                            time    DATETIME,
                            channel VARCHAR (256),
                            text    TEXT
                        );
                    `);
                    db.run(`
                        CREATE VIRTUAL TABLE IF NOT EXISTS logs_fts 
                        USING FTS5(text,content='logs',content_rowid='logs_id');
                    `);
                    db.run(`
                        CREATE TRIGGER IF NOT EXISTS logs_ai AFTER INSERT ON logs BEGIN
                            INSERT INTO logs_fts (rowid,text) VALUES (new.logs_id,new.text);
                        END;
                    `);
                    resolve(db);
                });
            });
            db.on('error',(e)=>{ if(e) { throw Error(e) } else { throw Error("logs db error")} });
        });       
    }
    async connect() {
        if(!this.db) {    
            this.db = await this.init();
        }
        return this.db; 
    }
    async run(sql) {
        var db = await this.connect();
        return new Promise((resolve,reject)=>{
            db.serialize(function(){
                db.run(sql);
                resolve(db);
            });
        });
    }
    async write(text,channel,time) {
        channel=channel||"private";
        time=time||"datetime()";
        if(!text) {
            throw TypeError("missing argument: text");
        }
            
        var db = await this.connect();
        return new Promise((resolve,reject)=>{
            var sql=`INSERT into logs (time,channel,text) VALUES (${time}, '${channel}', '${text}');`;
            db.serialize(function(){
                db.run(sql);
                resolve(db);
            })
        });
    } 
    async find(match,channel) {
        match=match||" ";
        //channel=channel||"private";
        var db = await this.connect();
        return new Promise((resolve,reject)=>{
            var filterChannel=channel=>(channel?` AND logs.channel='${channel}'`:''); 
            var sql = `select * from logs WHERE logs.logs_id IN (SELECT rowid FROM logs_fts where logs_fts MATCH '${match}') ${filterChannel(channel)}`;

            /*
            var sql=`
            SELECT 
                logs.logs_id, 
                logs.time, 
                logs.channel, 
                logs.text  
            FROM 
                logs_fts
            LEFT JOIN 
                logs ON logs_fts.rowid=logs.logs_id
            WHERE 
                logs_fts MATCH "${match}"
                AND logs.channel="${channel}" 
            ORDER BY 
                logs.log_id DESC;
            `;
            /* */
        
            db.serialize(function(){    
                db.all(sql,(err,rows)=>(err ? reject(err) : resolve(rows)));
            });
        });     
    }
}

module.exports = LogSqlite;