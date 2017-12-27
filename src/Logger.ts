export default class Logger{

    static log(message:any):void{
        console.log(message)
    }

    static error(message:any):void{
        console.error(message);
    }
}