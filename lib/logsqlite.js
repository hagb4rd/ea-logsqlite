var sqlite3 = require('sqlite3').verbose();


const defaultLogFileDirectory = process.env["EA_LOGSQLITE_PATH"] || process.env["HOME"] || process.env["USERPROFILE"] || __dirname;


class LogSqlite {  
    constructor(filepath, callback) {
        this.defaultChannel="private";
        this.filepath = filepath || (defaultLogFileDirectory + "/logs.sqlite");
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
        channel=channel||this.defaultChannel;
        time=time||"datetime()";
        if(!text) {
            throw TypeError("missing argument: text");
        }
        text = text.replace(/'/g,"''")
            
        var db = await this.connect();
        return new Promise((resolve,reject)=>{
            var sql=`INSERT into logs (time,channel,text) VALUES (${time}, '${channel}', '${text}');`;
            db.serialize(function(){
                db.run(sql);
                resolve(db);
            })
        });
    } 
    
    /**
     * Search LogSqlite Entries
     * @param  {string} query - sqlite fts5 match query. example: "Car AND (Blue OR Red)"
     * @param  {string} channel - Tag/Channel/Category
     * @param  {string} from - Date YYYY-MM-DD - filter results date >= from
     * @param  {string} to - Date YYYY-MM-DD - filter results date <= to
     * @return {Promise} - result dataset rows 
     */
    async find(query,channel,from,to) {
        if(typeof(query)=="object") {
            if(query['channel']){
                channel=query['channel']||'';
            }
            if(query['from']){
                from=query['from']||'';
            }
            if(query['to']){
                to=query['to']||'';
            }
            if(query['query']){
                query=query['query']||'';
            } else {
                query="";
            }
        }
        
        var validFormat = /\d{4}-\d{2}-\d{2}/;

        if(from) {
            from=String(from);
            if(!validFormat.test(from)) {
                throw new Error("Invalid Date format. Use YYYY-MM-DD.");
            }
        }
        if(to) {
            to=String(to);
            if(!validFormat.test(to)) {
                throw new Error("Invalid Date format. Use YYYY-MM-DD.");
            }
        }
        //channel=channel||"private";
        var db = await this.connect();
        return new Promise((resolve,reject)=>{
            var filterChannel=(channel=>(channel?` logs.channel='${channel}' `:''))(channel); 
            var filterDateFrom=(from=>(from?` date >= '${from}' `:''))(from);
            var filterDateTo=(to=>(to?` date <= '${to}' `:''))(to); 
            var fts5=(query=>(query?` logs.logs_id IN (SELECT rowid FROM logs_fts where logs_fts MATCH '${query}') `:''))(query);

            var where = ((fts5, filterChannel, filterDateFrom, filterDateTo) => {
                var conditions = [fts5, filterChannel, filterDateFrom, filterDateTo].filter(condition=>condition!="").join(" AND ")
                if(conditions) {
                    return " WHERE " + conditions;
                } else {
                    return "";
                }  
                        
            })(fts5, filterChannel, filterDateFrom, filterDateTo);

            var sql = `select *,date(time) as date from logs ${where}`;

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