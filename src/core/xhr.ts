import { AxiosRequestConfig, AxiosPromise, AxiosResponse } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'

export default function(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const { url, method = 'get', data = null, headers, responseType, timeout, cancelToken } = config

    const request = new XMLHttpRequest()

    if (responseType) {
      request.responseType = responseType
    }
    if (timeout) {
      request.timeout = timeout
    }

    request.open(method.toUpperCase(), url!, true)

    Object.keys(headers).forEach(name => {
      if (data === null && name.toLowerCase() === 'content-type') {
        delete headers[name]
      } else {
        request.setRequestHeader(name, headers[name])
      }
    })

    request.onreadystatechange = function() {
      if (request.readyState !== 4 || request.status === 0) {
        return
      }
      const responseData = responseType !== 'text' ? request.response : request.responseText
      const response: AxiosResponse = {
        config,
        request,
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: parseHeaders(request.getAllResponseHeaders())
      }
      handleResponse(response)
    }

    request.onerror = function() {
      reject(createError('Network Error', config, null, request))
    }

    request.ontimeout = function() {
      reject(createError(`Timeout of ${timeout} ms exceeded`, config, 'ECONNABORTED', request))
    }

    processCancel()

    request.send(data)

    function processCancel(): void {
      if (cancelToken) {
        cancelToken.promise
          .then(reason => {
            request.abort()
            reject(reason)
          })
          .catch(
            /* istanbul ignore next */
            () => {
              // do nothing
            }
          )
      }
    }

    function handleResponse(response: AxiosResponse): void {
      if (response.status >= 200 && response.status < 300) {
        resolve(response)
      } else {
        reject(
          createError(
            `Request failed with status code ${response.status}`,
            config,
            null,
            request,
            response
          )
        )
      }
    }
  })
}
