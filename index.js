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
 * node-Objekt wird in der Datenbank in der Collection 'collection' gespeichert
 *
 * @param collection {String} collection, in der User gespeichert sind, falls die collection noch nicht gibt, wird diese zunächst angelegt
 * @param node {Object}       neuer userObject, '_id' in dem Objekt ist optional, beim Fehlet der '_id' wird dieser automatisch erzeugt
 * @param callback {Function}  erstellter userObject
 */
exports.createNode = (collection, node = {}, callback = ()=> {
}) => {
    db.insertNode(collection, node, callback)
}

/**
 * ein gerichtetes Edge wird angelegt und zwar gerichtet vom userIdFrom nach userIdTo
 *
 * @param collection {String}  collection, in der User gespeichert sind
 * @param userIdFrom {String}  Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo {String}    Id des Users der von userIdFrom gefolgt wird
 * @param data {Object}     Eigenschaften der Beziehung
 * @param callback {Function}   UserObject mit dem Id userIdFrom
 */
exports.createConnection = (collection, userIdFrom, userIdTo, data = {}, callback = ()=> {
}) => {
    db.insertConnection(collection, userIdFrom, userIdTo, data, callback)
}

/**
 * data-Objekt wird in der Datenbank in der Collection 'content_collection' als Content gespeichert
 * ein gerichtetes Edge wird vom userIdFrom aus der Collection 'user_collection' zu dem ContenObject angelegt
 *
 * @param content_collection {String}    collection, in der Contents gespeichert sind
 * @param user_collection {String}       collection, in der User gespeichert sind
 * @param userIdFrom  {String}         Id des Users der den ContentObject erstellt hat
 * @param data {Object}                ContentObject
 * @param callback {Function}  erstellter ContentObject
 */
exports.createContent = (content_collection, user_collection, userIdFrom, data = {}, callback = ()=> {
}) => {
    db.insertContent(content_collection, user_collection, userIdFrom, data, callback)
}

/**
 * Eigenschaften von UserObject('id') werden ergänzt oder ersetzt.
 * Die drei Liste 'follow', 'followed' und 'content', sowie die Eigenschaft 'deleted'werden ignoriert.
 * für den Content wir update nicht gebraucht, es werden nur neue Contents eingefügt
 *
 * @param collection {String} collection, in der User gespeichert sind
 * @param id {String}         id des Users
 * @param newData {Object}    existierende keys werden bei dem User überschrieben, neue hinzugefügt
 * @param callback {Function}   modifizierter User
 *f
 */
exports.updateNode = (collection, id, newData, callback = ()=> {
}) => {
    db.updateNode(collection, id, newData, callback)
}

/**
 * Die Eigenschaften des Edges die gerichtet von userIdFrom nach userIdTo vorliegt, werden ergänzt oder ersetzt.
 *
 * @param collection {String} collection, in der User gespeichert sind
 * @param userIdFrom {String} Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo {String}   Id des Users der von userIdFrom gefolgt wird(weil wir zur Zeit die Eigenschaften doppelt speichern)
 * @param newData {Object}   neue Eigenschaften der Beziehung: die bestehenden Eigenschaften werden durch neue Eigenschaften komplett ersetzt
 * @param callback {Function} UserObject mit dem Id userIdFrom
 */
exports.updateConnection = (collection, userIdFrom, userIdTo, newData, callback = ()=> {
}) => {
    db.updateConnection(collection, userIdFrom, userIdTo, newData, callback)
}

/**
 * Eine Suchfunktion wird auf der Datenbank mit den Kriterien aus find-Object ausgelöst.
 *
 * @param collection {String} collection, in der User bzw. Contents gespeichert sind
 * @param find {Object}       Kriterium, für den gesuchten User bzw. Content
 * @param callback {Function}  eine Liste der gefundenen Users bzw. Contents
 */
exports.findNode = (collection, find, callback = ()=> {
}) => {
    db.findNode(collection, find, callback)
}

/*//die Liste aller Beziehungen werden mit dem User beim Suchen mitgeliefert, deswegen wird diese Funktion nicht gebraucht
 exports.findEdge = (relation, find, callback = ()=>{}) => {
 db.findEdge(relation, find, callback)
 }
 */
/**
 * Die Eigenschaft 'deleted' des Objectes('obId') wird auf 'true' gesetzt
 *
 * @param collection {String} collection, in der User bzw. Contents gespeichert sind
 * @param userId {String}     Id des Users bzw. des Contents
 * @param callback {Function} Obejct mit der Id obId
 */
exports.deleteNode = (collection, obId, callback = ()=> {
}) => {
    db.deleteNode(collection, obId, callback)
}

/**
 * Die Edges die gerichtet von userIdFrom nach userIdTo vorliegt wird aus der Datenbank entgültig gelöscht.
 *
 * @param collection {String}  collection, in der User gespeichert sind
 * @param userIdFrom {String} Id des Users der dem User mit dem ID userIdTo folgt
 * @param userIdTo {String}   Id des Users der von userIdFrom gefolgt wird
 * @param callback {Function}  UserObject mit dem Id userIdTo
 */
exports.deleteConnection = (collection, userIdFrom, userIdTo, callback = ()=> {
}) => {
    db.deleteConnection(collection, userIdFrom, userIdTo, callback)
}
