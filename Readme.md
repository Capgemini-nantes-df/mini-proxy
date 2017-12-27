# MiniProxy - proxyfy an api

## Installation 

Steps: 
- install node : [https://nodejs.org/en/](https://nodejs.org/en/)
- install typescript
```
npm install -g typescript
```
- install ts-node & nodemon
```
npm install -g ts-node
npm install -g nodemon
```
- install project
```
git clone []
```
- in clone directory,
```
npm install
...
````
All packages will be download.
It's Ready ! :+1:

## Getting configured

fill a route.ts file to add route 
```
export const routes = [
    {
        path:'/path/to/respond', 
        method:'get', 
        querystring:{
            'categ':'',
            'params1':''
        },
        cache:true,                         // cache is active
        postprocess:(data:any):any => {     // processing data
            return JSON.parse(data);
        },
        endpoint:{                          // url to call where data is
            url:'https://domain.where/{{categ}}',
            method:'POST',
            data: '{{params1}}',
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
]
```


And add a proxy.ts :
```
import {MiniProxy, RouteOptions} from './MiniProxy'
import * as routes from './../resources/route'

let proxy = new MiniProxy({
    activeCorsFilter:true,
    port:8081,
    corsOrigin:'*'
});

for (let route of routes.routes){
    proxy.addRoute(<RouteOptions>route);
}
proxy.start();
```

## Getting started 

To start in dev : 
```
npm run dev
```

or :
```
ts-node src/proxy.ts
```

