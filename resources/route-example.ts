export const routes = [
    {
        path:'/path/to/product',
        method:'get',
        querystring:{
            'categ':'',
            'params0':''
        },
        cache:true,
        postprocess:(data:any):any => {
            return JSON.parse(data);
        },
        endpoint:{
            url:'https://domain.of.restapi/product/{{categ}}',
            method:'POST',
            data: '{{params0}}',
            headers: {
                'Content-Type': 'application/json',
            }
        }
    }
]