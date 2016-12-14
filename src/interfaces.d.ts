// we need this because the typescript ES6 interface does not include an entry for observables
interface SymbolConstructor {
	readonly observable: symbol;
}
