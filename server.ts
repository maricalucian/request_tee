import http from "http"
import urlParser from "url"
import { endpoints, port } from "./config"

const parsedEndpoints: http.ClientRequestArgs[] = endpoints.map((endpoint: string) => ({
    ...urlParser.parse(endpoint),
    agent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
}))

http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const { method, headers } = req

    const requests: http.ClientRequest[] = parsedEndpoints.map((options) =>
        http
            .request({
                agent: options.agent,
                host: options.hostname,
                path: options.path,
                port: options.port,
                protocol: options.protocol,
                auth: options.auth,
                method,
                headers,
            })
            .on("error", (err) => {
                console.log(err)
            })
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
