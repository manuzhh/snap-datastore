/**
 * npm install mongodb
 *
 * zum ausführen in der console -> node dein_pfad/snap/libs/mongodb.js
 * testtest
 */

let content, content_properties, content_id, deleted
let follow, followed, from, to, connect_properties
let ObId = require('mongodb').ObjectID

const MongoClient = require("mongodb")
    .MongoClient
const assert = require('assert')

let _dbConnect = null
let _connectionDetails = null

let connect = (callback) => {
    if (_connectionDetails) {
        if (_dbConnect === null) {
            MongoClient.connect(_connectionDetails.host + _connectionDetails.dataStore, function (err, db) {
                if (!err) {
                    _dbConnect = db
                    if (callback) {
                        callback(null, db)
                    }
                    db.on('close', function () {
                        _dbConnect = null
                    })
                } else {
                    if (callback) {
                        callback("MongodbWrapper: Database connection error - " + err, null)
                    }
                }
            })
        } else {
            if (callback) {
                callback(null, _dbConnect)
            }
        }
    } else {
        callback("MongodbWrapper: You need to call init before you call any other function", null)
    }
}

exports.init = (connectionDetails, collectionsConfig) => {
    _connectionDetails = connectionDetails

    deleted = collectionsConfig.deleteduser

    content = collectionsConfig.content_list
    content_properties = collectionsConfig.content_properties
    content_id = collectionsConfig.content_id

    follow = collectionsConfig.follow_list
    followed = collectionsConfig.followed_list
    from = collectionsConfig.follow_id_from
    to = collectionsConfig.follow_id_to
    connect_properties = collectionsConfig.connect_properties
}

exports.insertNode = (col, data, callback) => {
    let a = new Array()
    if (!data.hasOwnProperty(follow)) {
        data[follow] = a
    }
    if (!data.hasOwnProperty(followed)) {
        data[followed] = a
    }
    if (!data.hasOwnProperty(content)) {
        data[content] = a
    }
    if (!data.hasOwnProperty(deleted)) {
        data[deleted] = false
    }
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            data = validateId(data)
            let collection = dbConnect.collection(col)
            collection.insertOne(data, function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    callback(null, records.ops[0])
                }
            })
        }
    })
}

exports.insertConnection = (col, userIdFrom, userIdTo, data, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let newData = {[follow]: {[to]: userIdTo, [connect_properties]: data}}
            updateNodeWithAddToSet(col, userIdFrom, newData, function (err, recordsFrom) {
                if (err) {
                    callback(err, null)
                } else {
                    newData = {[followed]: {[from]: userIdFrom, [connect_properties]: data}}
                    updateNodeWithAddToSet(col, userIdTo, newData, function (err, records) {
                        if (err) {
                            callback(err, null)
                        } else {
                            //origin recordsFrom = {"ok":1,"n":1,"nModified":1}
                            exports.findNode(col, {'_id': userIdFrom}, function (err, recordsFrom) {
                                if (err) {
                                    callback(err, null)
                                } else {
                                    if (recordsFrom[0]) {
                                        callback(null, recordsFrom[0])
                                    } else {
                                        callback(null, [])
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

exports.insertContent = (col_content, col_user, userIdFrom, data, callback) => {
    //erst insert content als node
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            data = validateId(data)
            let collection = dbConnect.collection(col_content)
            collection.insertOne(data, function (err, ContentResults) {
                if (err) {
                    callback(err, null)
                } else {
                    if (ContentResults.ops[0]) {
                        //danach insert content_id in die liste des users
                        let contentId = ContentResults.ops[0]._id
                        /*
                         * man könnte zusätzlich zu [content_id] auch [content_properties]:prop einfügen,
                         * dafür müsste man parameterliste um prop erweitern, dann würde newData so aussehen
                         * let newData = {[content]: {[content_id]: contentId, [content_properties]: prop}}
                         * */
                        let newData = {[content]: {[content_id]: contentId}}
                        updateNodeWithAddToSet(col_user, userIdFrom, newData, function (err, results) {
                            if (err) {
                                callback(err, null)
                            } else {
                                //origin results = {"ok":1,"n":1,"nModified":1}
                                exports.findNode(col_content, {'_id': contentId}, function (err, ContentResults) {
                                    if (err) {
                                        callback(err, null)
                                    } else {
                                        if (ContentResults[0]) {
                                            callback(null, ContentResults[0])
                                        } else {
                                            callback(null, [])
                                        }
                                    }
                                })
                            }
                        })
                    } else {
                        //ToDo: err definieren
                        callback('Content not inserted or inserted and not find', null)
                    }
                }
            })
        }
    })
}

exports.updateNode = (col, id, newData, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            /*
             * die drei Listen und delete flag dürfen über update nicht geändert werden
             * */
            if (newData.hasOwnProperty(follow)) {
                delete newData[follow]
            }
            if (newData.hasOwnProperty(followed)) {
                delete newData[followed]
            }
            if (newData.hasOwnProperty(content)) {
                delete newData[content]
            }
            if (newData.hasOwnProperty(deleted)) {
                delete newData[deleted]
            }
            let collection = dbConnect.collection(col)
            collection.updateOne({
                "_id": new ObId(id)
            }, {
                $set: newData
            }, function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    //origin records = {"ok":1,"n":1,"nModified":1}
                    exports.findNode(col, {'_id': id}, function (err, records) {
                        if (err) {
                            callback(err, null)
                        } else {
                            if (records[0]) {
                                callback(null, records[0])
                            } else {
                                callback(null, [])
                            }
                        }
                    })
                }
            })
        }
    })
}

exports.findNode = (col, find, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let collection = dbConnect.collection(col)
            find = validateId(find)
            collection.find(find).toArray(function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    callback(null, records)
                }
            })
        }
    })
}

exports.deleteNode = (col, userId, callback) => {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let collection = dbConnect.collection(col)
            collection.updateOne({
                "_id": new ObId(userId)
            }, {
                $set: {[deleted]: true}
            }, function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    //origin records = {"ok":1,"n":1,"nModified":1}
                    exports.findNode(col, {'_id': userId}, function (err, records) {
                        if (err) {
                            callback(err, null)
                        } else {
                            if (records[0]) {
                                callback(null, records[0])
                            } else {
                                callback(null, [])
                            }
                        }
                    })
                }
            })
        }
    })
}

function validateId(data) {
    if (data.hasOwnProperty('_id')) {
        data._id = new ObId(data._id)
    }
    return data
}

exports.updateConnection = (col, userIdFrom, userIdTo, newData, callback)=> {
    updateNodeListWithSet(col, userIdFrom, userIdTo, true, newData, function (err, recordsFrom) {
        if (err) {
            callback(err, null)
        } else {
            updateNodeListWithSet(col, userIdTo, userIdFrom, false, newData, function (err, recordsTo) {
                if (err) {
                    callback(err, null)
                } else {
                    exports.findNode(col, {'_id': userIdFrom}, function (err, records) {
                        if (err) {
                            callback(err, null)
                        } else {
                            if (records[0]) {
                                callback(null, records[0])
                            } else {
                                callback(null, [])
                            }
                        }
                    })
                }
            })
        }
    })
}


exports.deleteConnection = (col, userIdFrom, userIdTo, callback)=> {
    updateNodeWithPull(col, userIdFrom, userIdTo, true, function (err, recordsFrom) {
        if (err) {
            callback(err, null)
        } else {
            updateNodeWithPull(col, userIdTo, userIdFrom, false, function (err, recordsTo) {
                if (err) {
                    callback(err, null)
                } else {
                    exports.findNode(col, {'_id': userIdTo}, function (err, records) {
                        if (err) {
                            callback(err, null)
                        } else {
                            if (records[0]) {
                                callback(null, records[0])
                            } else {
                                callback(null, [])
                            }
                        }
                    })
                }
            })
        }
    })
}

function updateNodeWithAddToSet(col, id, newData, callback) {
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let collection = dbConnect.collection(col)
            collection.updateOne({
                "_id": new ObId(id)
            }, {
                $addToSet: newData
            }, function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    //origin records = {"ok":1,"n":1,"nModified":1}
                    callback(null, records)
                }
            })
        }
    })
}
function updateNodeWithPull(col, userIdFrom, userIdTo, followlist, callback) {
    //The $pull operator removes from an existing array all instances of a value or values that match a specified condition.
    let update
    if (followlist) {
        update = {[follow]: {[to]: userIdTo}}
    } else {
        update = {[followed]: {[from]: userIdTo}}
    }
    connect((err, dbConnect) => {
        if (err) {
            callback(err, null)
        } else {
            let collection = dbConnect.collection(col)
            collection.updateOne({
                "_id": new ObId(userIdFrom)
            }, {
                $pull: update
            }, function (err, records) {
                if (err) {
                    callback(err, null)
                } else {
                    //origin records = {"ok":1,"n":1,"nModified":1}
                    callback(null, records)
                }
            })
        }
    })
}

function updateNodeListWithSet(col, userIdFrom, userIdTo, isfollow, newData, callback) {
    exports.findNode(col, {'_id': userIdFrom}, function (err, records) {
        if (err) {
            callback(err, null)
        } else {
            if (records[0]) {
                let update, followlist, criteria
                if (isfollow) {
                    criteria = {'_id': new ObId(userIdFrom), [follow]: {$elemMatch: {[to]: new Object(userIdTo)}}}
                    followlist = records[0][follow]
                    for (let f in followlist) {
                        if (JSON.stringify(followlist[f][to]) == JSON.stringify(userIdTo)) {
                            //properties ersetzen
                            followlist[f][connect_properties] = newData
                        }
                    }
                    update = {[follow]: followlist}
                } else {
                    criteria = {'_id': new ObId(userIdFrom), [followed]: {$elemMatch: {[from]: new Object(userIdTo)}}}
                    followlist = records[0][followed]
                    for (let f in followlist) {
                        if (JSON.stringify(followlist[f][from]) == JSON.stringify(userIdTo)) {
                            //properties ersetzen
                            followlist[f][connect_properties] = newData
                        }
                    }
                    update = {[followed]: followlist}
                }

                connect((err, dbConnect) => {
                    if (err) {
                        callback(err, null)
                    } else {
                        let collection = dbConnect.collection(col)
                        collection.updateOne(criteria,
                            {
                                $set: update
                            }, function (err, records) {
                                if (err) {
                                    callback(err, null)
                                } else {
                                    callback(null, records)
                                }
                            })
                    }
                })
            }
        }
    })
}