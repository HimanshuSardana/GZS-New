FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o cms-api .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/cms-api .
EXPOSE 8080
CMD ["./cms-api"]
