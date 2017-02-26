"use strict"
/**
 * ToDo: Create dataStore module.
 *
 *
 */

const collectionsConfig = require('./config/collectionsConfig')
    .config;
let db;



exports.init = (config) => {
    switch (config.type) {
        case "mongodb":
            db = require('./lib/dataStore.mongoDB')
            break;
        case "neo4j":
            db = require('./lib/dataStore.neo4jGraphDb')
            break;
        default:
            console.error("Keine unterstütze Datenbank konfiguriert.")
    }

    db.init(config, collectionsConfig)

    return this
}



/**
 *
 * @param collection collection, in der User gespeichert sind, falls die collection noch nicht gibt, wird diese zunächst angelegt
 * @param node       neuer userObject, '_id' in dem Objekt ist optional, beim Fehlet der '_id' wird dieser automatisch erzeugt
 * @param callback   erstellter userObject
 */
//todo Funktionen sind bisher nur Beispiel createUser muss ggf in das User Module etc.
exports.createNode = (collection, node = {}, callback = ()=> {}) => {
    db.insertNode(collection, node, callback)
}

/**
 *
 * @param collection collection, in der User gespeichert sind
 * @param userIdFrom Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo   Id des Users der von userIdFrom gefolgt wird
 * @param data       Eigenschaften der Beziehung
 * @param callback   UserObject mit dem Id userIdFrom
 */
exports.createConnection = (collection, userIdFrom, userIdTo, data = {}, callback = ()=> {}) => {
    db.insertConnection(collection, userIdFrom, userIdTo, data, callback)
}

/**
 *
 * @param content_collection    collection, in der Contents gespeichert sind
 * @param user_collection       collection, in der User gespeichert sind
 * @param userIdFrom           Id des Users der den ContentObject erstellt hat
 * @param data                 ContentObject
 * @param callback             erstellter ContentObject
 */
exports.createContent = (content_collection, user_collection, userIdFrom, data = {}, callback = ()=> {}) => {
    db.insertContent(content_collection, user_collection, userIdFrom, data, callback)
}

/**
 *
 * @param collection collection, in der User gespeichert sind
 * @param id         id des Users
 * @param newData    existierende keys werden bei dem User überschrieben, neue hinzugefügt
 * @param callback   modifizierter User
 *für den Content wir update nicht gebraucht, es werden nur neue Contents eingefügt
 */
exports.updateNode = (collection, id, newData, callback = ()=> {}) => {
    db.updateNode(collection, id, newData, callback)
}

//ToDo neo4j anpassen und diese f-n löschen
exports.updateEdge = (relation, id, newData, callback = ()=> {}) => {
    db.updateEdge(relation, id, newData, callback)
}

/**
 *
 * @param collection collection, in der User gespeichert sind
 * @param userIdFrom Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo   Id des Users der von userIdFrom gefolgt wird(weil wir zur Zeit die Eigenschaften doppelt speichern)
 * @param newData   neue Eigenschaften der Beziehung: die bestehenden Eigenschaften werden durch neue Eigenschaften komplett ersetzt
 * @param callback  UserObject mit dem Id userIdFrom
 */
exports.updateConnection = (collection, userIdFrom, userIdTo, newData, callback = ()=> {}) => {
    db.updateConnection(collection, userIdFrom, userIdTo, newData, callback)
}

/**
 *
 * @param collection collection, in der User bzw. Contents gespeichert sind
 * @param find       Kriterium, für den gesuchten User bzw. Content
 * @param callback   eine Liste der gefundenen Users bzw. Contents
 */
exports.findNode = (collection, find, callback = ()=> {}) => {
    db.findNode(collection, find, callback)
}

/*//die Liste aller Beziehungen werden mit dem User beim Suchen mitgeliefert, deswegen wird diese Funktion nicht gebraucht
exports.findEdge = (relation, find, callback = ()=>{}) => {
    db.findEdge(relation, find, callback)
}
*/
/**
 *
 * @param collection collection, in der User bzw. Contents gespeichert sind
 * @param userId     Id des Users bzw. des Contents
 * @param callback
 */
exports.deleteNode = (collection, obId, callback = ()=> {}) => {
    db.deleteNode(collection, obId, callback)
}

/**
 *
 * @param collection  collection, in der User gespeichert sind
 * @param userIdFrom Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo   Id des Users der von userIdFrom gefolgt wird
 * @param callback   UserObject mit dem Id userIdTo
 */
exports.deleteConnection = (collection, userIdFrom, userIdTo, callback = ()=> {}) => {
    db.deleteConnection(collection, userIdFrom, userIdTo, callback)
    //ToDo Neo4j noch anpassen
    //db.deleteEdge(userId, callback)
}
