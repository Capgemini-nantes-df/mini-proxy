import {MiniProxy, RouteOptions} from './MiniProxy'
import * as routes from './../resources/route'

let proxy = new MiniProxy({
    activeCorsFilter:true,
    port:8081,
    corsOrigin:'*'
});
//console.log(routes);

for (let route of routes.routes){
    proxy.addRoute(<RouteOptions>route);
}


proxy.start();