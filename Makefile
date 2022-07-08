build:
	go build -ldflags "-s -w" -o bin/main main.go

run:
	go run *.go

protogen:
	protoc --go_out=. --go_opt=paths=source_relative models.proto
	pbf models.proto > client/js/models.js