import http from "http"
import https from "https"
import urlParser from "url"
import { endpoints, port } from "./config"

const parsedEndpoints: http.ClientRequestArgs[] = endpoints.map((endpoint: string) => {
    const urlOptions = urlParser.parse(endpoint)
    return {
        ...urlOptions,
        agent:
            urlOptions.protocol === "https:"
                ? new https.Agent(/*{ keepAlive: true }*/)
                : new http.Agent(/*{ keepAlive: true }*/),
    }
})

http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const { method, headers } = req
    let data: Uint8Array[] = [];

    const requests: http.ClientRequest[] = parsedEndpoints.map((options) => {
        return http
            .request({
                agent: options.agent,
                host: options.hostname,
                path: options.path,
                port: options.port,
                protocol: options.protocol,
                auth: options.auth,
                method,
                headers: { ...headers, host: `${options.hostname}:${options.port}`},
            })
            .on("error", (err: any) => {
                console.log(err)
            })
            .on("response", (r: any) => {
                console.log(`${options.hostname}: ${r.statusCode} - ${r.statusMessage}`)
            })
    })

    req.on("data", (chunk: any) => {
        requests.forEach((request: http.ClientRequest) => {
            request.write(chunk)
        })

        data.push(chunk)
    }).on("end", () => {
        const dataToSend = Buffer.concat(data).toString();
        console.log("request data ", dataToSend);

        requests.forEach((request: any) => {
            // request.write(dataToSend)
            request.end()
        })
    })

    res.writeHead(200)
    res.end()
}).listen(port)

console.log(`Server running at http://127.0.0.1:${port}/`)
