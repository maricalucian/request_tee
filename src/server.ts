import http from "http"
import https from "https"
import urlParser from "url"
import { endpoints, port } from "./config"

const parsedEndpoints: http.ClientRequestArgs[] = endpoints.map((endpoint: string) => {
    const urlOptions = urlParser.parse(endpoint)
    return {
        ...urlOptions,
        rejectUnauthorized: false,
        agent:
            urlOptions.protocol === "https:"
                ? new https.Agent({ keepAlive: true, maxSockets: 10 })
                : new http.Agent({ keepAlive: true, maxSockets: 10 }),
    }
})

http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const { method, headers } = req

    const requests: http.ClientRequest[] = parsedEndpoints.map((options) =>{
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
                console.log(r)
            })
        }
    )

    req.on("data", (chunk: any) => {
        requests.forEach((request: http.ClientRequest) => {
            request.write(chunk)
        })
    }).on("end", () => {
        requests.forEach((request: any) => {
            request.end()
        })
    })

    res.writeHead(200)
    res.end()
}).listen(port)

console.log(`Server running at http://127.0.0.1:${port}/`)
