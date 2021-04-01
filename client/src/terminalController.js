import ComponentsBuilder from "./components.js";
import { constants } from "./constants.js";



export default class TerminalController{

    #usersColors = new Map()
    constructor(){}

    #pickColor(){
        return `#${((1 << 24) * Math.random() | 0).toString(16)}-fg`
    }

    #getUserColor(userName){
        if(this.#usersColors.has(userName)) 
            return this.#usersColors.get(userName)

        const color = this.#pickColor()
        this.#usersColors.set(userName, color)

        return color;
    }

    #onInputReceiver(eventEmitter){
        return function(){
            const message = this.getValue()
            console.log(message);
            this.clearValue()
        }
    }

    #onMessageReceived({screen, chat}){
        return msg => {
            const {userName, message} = msg;
            const color = this.#getUserColor(userName)
            chat.addItem(`{${color}}{bold}${userName}{/}: ${message}`)
            screen.render()
        }
    }
    
    #onLogChanged({screen, activityLog}){
        return msg => {
            const [userName] = msg.split(/\s/);
            const color = this.#getUserColor(userName);
            activityLog.addItem(`{${color}}{bold}${msg.toString()}{/}`)
            screen.render()
        }
    }
   
    #onStatusChanged({screen, status}){
        return users => {

            const { content } = status.items.shift()
            status.clearItems()
            status.addItem(content)

            users.forEach(userName => {
                const color = this.#getUserColor(userName)
                status.addItem(`{${color}}{bold}${userName}{/}`)          
            })

            screen.render()
        }
    }

    #registerEvents(eventEmitter, components){
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components))
        eventEmitter.on(constants.events.app.ACTIVITYLOG_UPDATED, this.#onLogChanged(components))
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusChanged(components))
    }

    async initializeTable(eventEmitter){
        const components = new ComponentsBuilder()
            .setScreen({title: 'Chat'})
            .setLayoutComponent()
            .setInputComponent(this.#onInputReceiver(eventEmitter))
            .setChatComponent()
            .setActivityLogComponent()
            .setStatusComponent()
            .build()

        this.#registerEvents(eventEmitter, components)

        components.input.focus()
        components.screen.render()

        setInterval(() => {

            const users = ['Zeev']

            eventEmitter.emit(constants.events.app.MESSAGE_RECEIVED, {message: 'hey', userName: 'Zeev'})
            eventEmitter.emit(constants.events.app.MESSAGE_RECEIVED, {message: 'hello', userName: 'Mica'})
            eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'Zeev joined')
            eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'Mica joined')
            eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'Zeev left')
            eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'Mica left')
            eventEmitter.emit(constants.events.app.STATUS_UPDATED, users)
            users.push('Mica')
            eventEmitter.emit(constants.events.app.STATUS_UPDATED, users)
            users.push('Netanel')
            eventEmitter.emit(constants.events.app.STATUS_UPDATED, users)
        }, 2000)
    }
}