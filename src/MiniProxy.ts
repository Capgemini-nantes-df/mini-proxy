import * as restify from "restify";
import * as https from "https";
import Logger from "./Logger";



export interface MiniProxyOptions{
    activeCorsFilter:boolean;
    corsOrigin?:string;
    port:number
}

export interface RouteOptions{
    path:string;
    method:string;
    querystring:any;
    endpoint:RouteEndpoint;
    cache:boolean;
    postprocess:(data:any)=>any;
}


export class RouteEndpoint{
    url?:string;
    host?:string;
    method:string;
    port?: number;
    path?: string;
    data?: any;
    headers: any;

    constructor(options:any){

        this.url = options.url;
        this.host = options.host;
        this.method = options.method || 'get';
        this.port = options.port;
        this.path = options.path;
        this.data = options.data;
        this.headers = options.headers || {};

        if (this.url){
            this.parseUrl(this.url);
        }
    }
    parseUrl(url:string){
        let parts = url.split( '/' );
        let protocol = parts[0];
        let host = parts[2];
        let qsPart = parts[parts.length-1].split("?");
        let qs = qsPart[1];
        let path = '/'+parts.slice(3,parts.length-1).join('/')+'/'+qsPart[0];
        this.host = host;
        this.path = path;
        this.url = undefined;
        if (protocol == 'http:' )this.port=80;
        if (protocol == 'https:')this.port=443;

    }
}

export class MiniProxy {

    private options:MiniProxyOptions;
    private server:restify.Server;

    private MEMORYCACHE:any = {};


    constructor(options:MiniProxyOptions){
        this.options = options;
        this.initServer();
        if (this.options.activeCorsFilter){
            this.initForCors();
        }
    }

    private initServer():void{
        this.server = restify.createServer();
        this.server.use(restify.plugins.queryParser());
    }

    private initForCors():void{

        this.server.opts('/\.*/', (req:any, res:any) => {
            const origin = req.header('origin');
            const allowedOrigins = ['*'];
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            res.setHeader('Access-Control-Max-Age', 864000);
            return res.send(200);
        });
    }


    private genHash(str:string):string{
        var hash = 0, i, chr;
        if (str.length === 0)return ""+hash;
        for (i = 0; i < str.length; i++) {
          chr   = str.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; 
        }
        return ""+hash;
    }



    private sendRequest(requestInfo:RouteEndpoint, resolve:(data:any)=>void, error:(err:Error) => void):void{
        

        console.log(requestInfo);
        var postRequest = https.request(requestInfo, (dataCallback) => {
            dataCallback.setEncoding("utf8");
            let body = "";      
            dataCallback.on('data',(chunk) => {
                body += chunk;
            });
            dataCallback.on('end', ()=>{            
                resolve(body)
            });
        });

        if (requestInfo.data)
            postRequest.write(requestInfo.data) /** ,"parents":["HOME"] */

        postRequest.end();
        postRequest.on('error', error);    
    }

 
    private replaceVarsInStringByValue(str:string, values:any):string{
        return str.replace(/\{\{(\w+)\}\}/gi, function(match, parensMatch) {
            if (values[parensMatch] !== undefined) {
              return values[parensMatch];
            }
            return match;
          });

    }



    addRoute(options:RouteOptions){

        let resolving = (req:any, res:any, next:any) => {
            /*** CORS */
            if (this.options.activeCorsFilter){
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /*** Remplacement des variables */
            let vars:any = {}
            for (let opt in options.querystring){
                if (req.query)
                    vars[opt] = req.query[opt];
            }
            let endpoint = new RouteEndpoint(options.endpoint);
            endpoint.data = this.replaceVarsInStringByValue(endpoint.data, vars);
            endpoint.path = this.replaceVarsInStringByValue(endpoint.path||"", vars);


            /*** gestion du cache */
            let uniq = req.url+req.getQuery()+"-"+endpoint.data;
            let hash = this.genHash(uniq);

            if (hash in this.MEMORYCACHE && options.cache){
                let data=this.MEMORYCACHE[hash];
                Logger.log("Result from cache : [key:"+hash+"] "+JSON.stringify(data).length+" bytes Cache size: "+JSON.stringify(this.MEMORYCACHE).length);
                res.send(data);
                next();
            }else{
                this.sendRequest(endpoint, (body) => {
                    let data = options.postprocess(body);

                    if (options.cache){
                        this.MEMORYCACHE[hash]=data;
                    }                    
                    Logger.log("Result from request : ["+hash+"] "+JSON.stringify(data).length+" bytes");

                    res.send(data);
                    next();
                },
                (err)=>{
                    Logger.error(err);
                } );
            }           
        }

        /*** Envoi de la requete */
        if (options.method == 'get')
            this.server.get(options.path, resolving);
        if (options.method == 'post')
            this.server.post(options.path, resolving);

    }

    start(){
        this.server.listen(this.options.port,()=>{
            Logger.log("["+this.server.name+"] Listening ("+this.server.url+")");
        });
    }




}