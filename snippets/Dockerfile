FROM alpine:3.19

WORKDIR /opt/snippets

RUN apk --no-cache add scryer-prolog

COPY . .

CMD ["scryer-prolog", "main"]
