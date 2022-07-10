package main

func RemoveIndex[T any](s []T, index int) []T {
	ret := make([]T, 0)
	ret = append(ret, s[:index]...)
	return append(ret, s[index+1:]...)
}

func Map[T any, Z any](data []T, callback func(T) Z) []Z {
	result := []Z{}
	for _, d := range data {
		result = append(result, callback(d))
	}
	return result
}
