var sqlite3 = require('sqlite3').verbose();

class LogSqlite {  
    constructor(filepath, callback) {
        this.filepath = filepath;
        this.db=null;
        
    }
    init(callback) {
        return new Promise((resolve,reject)=>{
            var db = new sqlite3.Database(this.filepath,(sqlite3.OPEN_READWRITE | sqlite3.PEN_CREATE), (err,docs) => {
            
            if(err)
                reject(err);

            db.serialize(function() {

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
                    USING FTS5(text,content=logs,content_rowid="logs_id");
                `);

                db.run(`
                    CREATE TRIGGER IF NOT EXISTS logs_ai AFTER INSERT ON logs
                    BEGIN
                        INSERT INTO logs_fts (rowid,text) VALUES (new.logs_id,new.text);
                    END;
                `);
            }, (err,docs)=>{    
                    if(err)
                        reject(err);
                    
                    resolve(db);
                });
            });
        });
    }
    async connect() {
        if(!this.db) {
            this.db = await init();
        }
        return this.db; 
    }
    async run(sql) {
        var db=await this.connect();
        return new Promise((resolve,reject)=>db.run(sql,(err,docs)=>{if(err)reject(err);resolve(docs);}));
    }
    async write(text,channel,time) {
        channel=channel||this.defaultChannel||"-";
        time=time||"datetime()";
        if(!text) 
            throw TypeError("missing argument: text");
        var db = await this.connect();
        db.run(`
            INSERT into logs (time,channel,text) VALUES (${time}, ${channel}, ${text})
        `)
    } 
    async find(match,channel) {
        match=match||" ";
        channel=channel||this.defaultChannel||"-";
        var rows = await this.run(`
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
                AND logs.channel="${chanel}" 
            ORDER BY 
                logs.time DESC
        `);
        return rows;
    }     
}