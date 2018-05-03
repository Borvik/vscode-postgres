/*
Function Validator - Reverse Parses until it finds the function name
Needs to keep track of argument count, and track back through
  comments (line and block)
  quotes (')
  identifiers (")

An open parenthesis either triggered this (which should make finding the beginning easier)
  or means we are near the end
*/