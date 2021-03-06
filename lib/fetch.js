'use strict'

const got = require('got')
const retry = require('p-retry')
const stringify = require('querystring').stringify

let token

const getNewToken = () =>
    got.post("https://api.cp.pt/cp-api/oauth/token", {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Basic Y3AtbW9iaWxlOnBhc3M=', // Base64 of "cp-mobile:pass"
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: stringify({
            grant_type: 'client_credentials'
        })
    })
    .then((res) => JSON.parse(res.body))
    .then((res) => res.access_token)

const savedToken = () => token ? Promise.resolve(token) : renewSavedToken()

const renewSavedToken = () =>
    getNewToken()
    .then((res) => {
        token = res
        return res
    })

const getRequest = (url, params = {}) => (token) =>
    got.get(url, {
        json: true,
        query: params,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then((res) => res.body)

const get = (url, params) =>
    retry(() => savedToken()
            .then(getRequest(url, params))
            .catch((error) => renewSavedToken), // todo: handling non-token-specific errors
        {retries: 3}
    )

const postRequest = (url, body = {}) => (token) =>
    got.post(url, {
        body: JSON.stringify(body),
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then((res) => JSON.parse(res.body))

const post = (url, body) =>
    retry(() => savedToken()
            .then(postRequest(url, body))
            .catch((error) => renewSavedToken), // todo: handling non-token-specific errors
        {retries: 3}
    )


module.exports = {
    get,
    post
}
