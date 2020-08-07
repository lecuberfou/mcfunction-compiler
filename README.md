# mcfunction-compiler

A javascript compiler to convert .mcpp code to .mcfunction code
Un compilateur javascript pout convertir le code .mcpp en code .mcfunction

## MC++ (.mcpp) syntax :

### Types :

* `int` :
	* is stored in scoreboards
	* can be in the inclusive range between -2147483648 and 2147483647
	* operations such as `+` `-` `*` `/` `%` and `+=` `-=` `*=` `/=` `=` are possible
	* comparisons between ints are possible (`<` `>` `<=` `>=` `==`)

### Conditions :

* `if` and `else` statements are supported, not `elseif` or `else if`

### Functions :

* load, has to be `void`, is called on the datapack reload
* tick, has to be `void`, is called on each server tick (20 times/second)

* any other function can have any type.

```

void load () {
	tellraw(@a, 'Hello world!');
}

void tick () {

}

```