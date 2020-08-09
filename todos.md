
Nil - Used for representing empty lists, or collections of zero length. For sets you can use Set.empty

None - One of two subclasses of the Optional type, the other being Some. Very well supported by the Scala collections.

Unit - Equivalent to Java's void which is used for functions that don't have a return type

Nothing - A trait. It is a subtype of all other types, but supertype of nothing. It is like the leaf of a tree. No instances of Nothing.

Null - A trait. Not recommended to be used.

null - An instance of the trait, similarly used as the Java Null. Not recommended to be used.


---------






- functia
token -> ce id are onchain
interpret -> executia in limbajul in care esti
toString: token -> add
execute on-chain



cut(b, i) -> 2
slice(b, s, e)

dependent types


- same mechanism: left bytes are root categories - you can upcast, not downcast without cast method

zip -> labels for struct

contig, concat


log: previous state of an abject, then the mason of the process, for changing that object; mason = hash of the taylor process (program applied on the object)

- functii cu # (mobile sensors)
- aplicatia de mobile: 2 simulatoare: javascript (mal) & ewasm (ewasm vm in mal)

daca nu's uint-uri sa le faca uinturi

todo:
- address type
- printer tests separately
- boolean - lt, gt, etc. should be boolean
- fix blockhash test
- BN ranges for mal, like on-chain (typed mal)
- implement (str ) & (bytes );
- move malbackend in a separate package; packages, editor folders, lerna
- last encoding - with integers
- todo - fix symbols in mal for production use
- fix reduce from def
- simulatorul de chain sa stie ce chain simuleaza; e.g. deploy pe mainnet - foloseste acceasi adresa in simulator; 
- currying
- map cu lists - oricate argumente
- zip
- store deployment block in contract -> for logging purposes;
- fix recursive: self
- 2 types of struct: 1) with values 2) with ids to where you find values
- zip, unzip
- hash-map keys, values

--------

Sa poata din ark sa-si cumpere un nume.
oricine poate sa inregistreze ip-ul ca string (dns)
duck-duck-go -> sa foloseasca un cache al db-ului astuia sa dea rezultate;
proxy - cautare pe duckduck, sa ataseze la inceputul paginii rezultatele de pe ethereum/ropsten;


----------

- fixed length, until 32 bytes
- storage: variable lengths, 8 instead of 32 - parametrization
- bulk insert
- tuple, struct (pointers)
- functions save in the dynamic storage system (functions have an id -> index where they are stored)
- toggle live gas cost estimations

struct/tuple by reference -> save each component at type -> save struct with pointers to each type;


gas for save
ether - effort system
ether - effort for future

send to another wallet
owner withdraw from contract


- those who store functions used by others -> paid when others store functions using their functions
- struct in struct
- owner payment -> tract gas spent - execution cost
- taylor by intent - how to start coding depending on your intention
- swap id mapping-unknown
- storage index - start at 1 not 0
- name!
- getsig(Voter)
- count(typesig)
- striing type
- seq! = list - (seq! (!) ())
- slicestore!
- list available functions
- mason: 2 values at same location in memory: hashed inputs * succesively hashed result (function execution result)
- test for lambda in lambda
- types as functions (String 3), (Array 3 4 (Uint 4))
- fix (let* (somefunc (fn* ...)) ..)

- struct in struct
- dynamic array in struct
- fix autocomplete doubling values; add structs/mappings for function arguments
- editor - deploy a fresh taylor contract




Storage:
1) array - static length (simple types) (--)
2) array - static, variable length size - contiguous (*)
3) array - dynamic, non-contiguous



TODO:
- deploy contracts on all testnets
- publish new editor version on github pages


SHOW:
- same contract in solidity & taylor
- show something solidity doesn't have - e.g. map/reduce
- transaction costs
- interact with solidity contract from taylor


- proof of format
- proof of storage
- proof of transmision
- proof of naming



- packet de npm pt taylor + folosi in browser
- test contig, concat with String
- deploy pe ropsten/rinkeby
- micropayment contract

- deployTaylor api
- addresses deployed must be in package

1. (slice array)
2. 
- bytesToArray bytes + slotlength + offset -> array de slots filled cu valorile de la bytes
- arrayToBytes array de offset & length -> bytes

- update for dynamic lengths

(def! sliceArray (fn* (somearr rangeindexes) 
    (map
        (sliceArray __ (rest rangeindexes))
        (slice somearr (first rangeindexes))
    )
))

(map fsig arr1 arr2 arr3)

1) -> (fsig arr1_item, arr2_item, arr3_item)
2) -> (list (fsig arr1_item) (fsig arr2_item) (fsig arr3_item) )

0 - somef
0x
110000010100000000000001
900000408c000040
11000001010000000000000290000002
0100000000000001
0100000000000002010000000000000390000040

1 - a
0x0a9100040000000401000000000000030a9100040000000500000000000000000000000000000000000000000000000000000000000000020000000000000000

2 - b?
0x
110000010100000000000002900000020100000000000001010000000000000201000000000000039000004001000000000000000a9100040000000401000000

3 - somef2 (uses b)
0x
110000010100000000000002
900000020100000000000001010000000000000201000000000000039000004001000000000000000a9100040000000401000000



0x
90000060
11000004
0100000000000000
8c000058
11000001
0100000000000001
88000040
8c000030
11000000
900000020100000000000001
0a9100040000000a

0100000000000002
9000004001000000000000000a91000400000004

9000004001000000000000020a91000400000000



0x
90000060
11000004
0100000000000000
8c000050
11000001
0100000000000001
8c000030
11000000
90000002
0100000000000001
0a9100040000000a

0100000000000002
90000040
0100000000000000
0a91000400000004

90000040
01000000000000020a91000400000000


0x9000004001000000000000020a910004000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000

0x01000000000000000a910004000000049000004001000000000000020a9100040000000000000000000000000000000000000000000000000000000000000000

somef2
0x1100000101000000000000018c000030110000009000000201000000000000010a9100040000000a01000000000000029000004001000000000000000a910004


0x
11000000
9000000201000000000000010a9100040000000a
01000000000000029000004001000000000000000a91000400000004900000400100000000000002

0x110000009000000201000000000000010a9100040000000a01000000000000029000004001000000000000000a91000400000004900000400100000000000002


0x0a91000400000004
9000004001000000000000020a91000400000000000000000000000000000000000000000000000000000000000000000000000200000000

0x
11000001
0100000000000001

apply eval:
8c000030
110000009000000201000000000000010a9100040000000a01000000000000029000004001000000000000000a910004

0x8c0000501100000101000000000000018c000030110000009000000201000000000000010a9100040000000a0100000000000002900000400100000000000000



0x8c000030110000009000000201000000000000010a9100040000000a01000000000000029000004001000000000000000a910004000000049000004001000000


0x1100000101000000000000018c00003011000000900000020100000000000001


0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002ec000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000002ec00000000000000000000000000000000000000000000000000000000000001240000000000000000000000000000000000000000000000000000000000000002



0x8c0000501100000101000000000000018c000030110000009000000201000000
0x0000000000000000000000000000000000000000000000000000000000000000
0x8c00007000000000000000000000000000000000000000000000000000000000


0x0000000000000000000000000000000000000000000000000000000000000003
00000000000000000000000000000000000000000000000000000000000000d0
0000000000000000000000000000000000000000000000000000000000000110
00000000000000000000000000000000000000000000000000000000000002ec



0x8c000030110000009000000201000000000000010a91000400000000000000000000000000000000000000000000000000000000000000030000000000000000

0x000000000000000000000000000000000000000000000000000000000000028c8c000030110000009000000201000000000000010a9100040000000000000000


0x
8c000090
00000000000000000000000000000000000000000000000000000000000014141100000101000000000000059800010c0a910004000000060a910004000000010a91000400000002


0x000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000015040000000000000000000000000000000000000000000000000000000000002e8c000000000000000000000000000000000000000000000000000000000000292c00000000000000000000000000000000000000000000000000000000000027dc000000000000000000000000000000000000000000000000000000000000292c0000000000000000000000000000000000000000000000000000000000002c780000000000000000000000000000000000000000000000000000000000001504

0x000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000015040000000000000000000000000000000000000000000000000000000000002e8c000000000000000000000000000000000000000000000000000000000000292c00000000000000000000000000000000000000000000000000000000000027dc000000000000000000000000000000000000000000000000000000000000292c0000000000000000000000000000000000000000000000000000000000002e8c0000000000000000000000000000000000000000000000000000000000001504

0x0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000030c000000000000000000000000000000000000000000000000000000000000128800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000440000000000000000000000000000000000000000000000000000000000000030c8c000068000000000000000000000000000000000000000000000000000000000000144411000001010000000000000501000000000000040000000000000000


0 - matrix
1
0x40000002400000020a9100040000000000000002000000000000000100000000
2
0x0000000000000000000000000000000000000000000000000000000000000000
3 - fillfunc
0x8c0000481100000101000000000000048c000028110000010100000000000005
4 - origMatrix - 160 - [ [ 6, 1, 2 ], [ 3, 4, 0 ] ]

5 - indexList - 192

- addresses in npm package
- deploy & add in local storage as a root
- deploy with functions -> scroll with function names, all selected
- function dependency -> selected autom
- bulk commands in editor -> result is an array
- highlight - lisp ; paranthesis matcher
- deployment contracte, update github pages
- open issues, cleanup this readme
- travis run tests


- add navigation buttons to luxor & back
- see why deployment doesn't work
- get rid of rerendering everything when editing - keep code only in editor - as a separate component which receives the backend interpreters
- luxor: selection range to be used as a list in a formula
- better highlight - e.g. function signatures in ""
- screenshots in readme & link to videos


- clear spreadsheet, maintain sheet in local storage
- multiple spreadsheets




- eth-call-raw
- map with direct (unnamed) lambda with environment
- copy issue
- extend writing issue

- mai mare functia
- fix list/array encoding - give nested types for items.
- fix copy
- luxor: todo list



- get gas price, forward to transaction
- simplify spreadsheet
special marker for functions to differentiate from unknowns. Or do this automatically.


key-value -> instead, function - update hierarchy.
hierarchy of dependencies
copy value from cell not formula

- table-rowf / table-callf -> receives an array & shows column first / rowfirst
table-row
table-col

-> cell 

Nobody pays me for this work. I work for retweets. If you don't retweet, ..

proiectele care sunt voluntariat sunt ingropate
I expect every ethereum publication to tell me, every time I have a demo, why they don't want to include it in the publication - as a min of support for volunteering devs
explain to me what I can do to get it published in the future

who is volunteer and who is not - this information is obfuscated
ping everyone personally


widows offering
influencers can bring more
able to show that you value me at your maximum capacity
I apreciate also people who go to the past tweets & retweet

#ethetics
#loredanasetics

Nu este prima data cand incerc sa scot toti ceilalti actori de pe scena,



remove intermediaries - remove corruption
coder - employer - user
coder -> (ip) -> employer -> (product) -> user
user -> (money) -> coder
user -> (money) -> employer



=(reduce add (srange D7 D11) 0)



lengthRanges (map (fn* (len) (array 0 (sub len 1))) (inverse (lengths matrix)))

lengths - doesn't work with lists
func vs. _func



(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))


dependencies
{
    name: []
}


Test Suites: 1 failed, 1 total
Tests:       1 failed, 66 skipped, 164 passed, 231 total
Snapshots:   0 total
Time:        215.63s


srange\s(\b[A-Z]{1}[0-9]{1,}){1,}

(add (reduce add (srange A2 C4)) 3)




"utils.ethsend(" "0xe80F22626C37792382d15f5B960bF32Fee869E7A" "," "increase(uint)" "," (7) ")"


care este cel mai flexibil dapp
care sunt caracteristicile unui dapp flexibil

"somevar()->(uint)"

"name()->(string memory)" (list) )

"increase(uint)" (list 7)

"setname(string memory)" (list "New Name")

=(eth-call! A7 "increase(uint)" (list 4))

=(eth-call! A2 B5 C5)


=(eth-call A2 B2 (list D2 5))




pipeline, dtype, taylor, luxor



0x8c0000a81100000101000000000000058c0000881100000101000000000000069800004804010020000000000000000000000000000000000000000000000000007000690063006b01000000000000050100000000000006



=(table-rowf "H14" G10)

=(table-rowf "H14" (array 10 12 13))

=(table-rowf "H14" (array (array 10 12 13) (array 110 112 113) ))

=(table-colf "H14" (array (array 10 12 13) (array 110 112 113) ))

=(table-colf "H18" (list (array 10 12 13) (array 110 112 113) ))

=(table-colf "H18" (list (array (array 10 12 13) (array 110 112 113) )))

it is more complex than you think - we have asynchronous formulas & a functional language developed in the last two years


- multiple sheets
- formula docs - autocomplete + spreadsheet
- update for table-rowf generated values; readonly & add deps in another key aside from text
- do in js matrix calculations
- functie care etaleaza ABI-urile -> form from fields
- load all examples - in Luxor; sheet with all examples
- quux-eval
- don't execute, but show all tests on a sheet.
- darker sheet color


yarn add @rowsncolumns/spreadsheet@1.7.13



(eth-pipe
    (list
        (list <address> <human_readable_sig> (list inputs))
    )
    (list (list <node_id> <io_id>))
)


step = 
0: contractaddr
1: fsig
1: payIndex
2: inputIndexes array
3: outputHasSlotSize array


(replace unknown newvalue)


(list inputs )


(call contractAddr fsig value data)

(concat )

- replacement of initial input list -> recursive

join - for lists & array / meld with arrayToBytes

bytes - length 32 -u32

len % 4 > 0 --> len = (len/4 + 1 ) * 4



- list calls if you know the arguments
- graph



thank Dave for the first user Luxor/Taylor have if Dudley uses it.

Thank you for your trust that these projects will evolve in the correct fashion. I hope you will hold us responsible if we derail.



- creating dtypes  & seeing all the records
- the type for dtypes
- db navigation


dropdown to choose a type

ui-pick: data
tay-types
tay-functions


- in luxor sheet - settings page

- def-untyped!
- insert types with def!

- assign id
- get id
- get length
- cast functions

(index, newtype inputs)
parent: root_id + 



0072006f006f0074

0x
0000000000000003
0000000000000000
4800000000000010
0072006f006f0074
1a38000400000004
1a3800040000001c
c00000000000000000000000000000000


- store -> uint & see correct ids

0xa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49

0x000000442880000500000000000000001a380004000000041a3800040000001c00000000000000000000000000000000000000000000000000000000000000000000000000000000288000050000000000000000000000000000000000000000

0x000000442880000500000000000000001a380004000000041a3800040000001c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

0x
00000012
006e0075006d006200650072
00000044288000050000000000000000
0x000500000000000000001a380004000000041a3800040000001c000000000000

0x2880000500000000000000001a380004000000041a3800040000001c
00000000000000000000000000000001
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

9c6b2c1b0d0b25a008e6c882cc7b415f309965c72ad2b944ac0931048ca31cd5
9c6b2c1b0d0b25a008e6c882cc7b415f309965c72ad2b944ac0931048ca31cd5


00000000000000000000000000000001

0x2880000500000000000000001a380004000000041a3800040000001c0000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000


Intre care numere din stack face add?

- try them before everything else

result_ptr -> values


-> number


0x0e00000000000001

 + len 

- function, not 0e....
- what to do with args without sig - to process them early
- danger: mload(value) -> crashes

- loop, if, apply
- list instructions
- tuple - collection of values



(mstore_ val) -> _ptr


(mstore__ "0x4455") -> t2
(mmstore__ "0x44554fdg56t5535455454353554354353534553453535353534353") -> t2


- no memory management
- bytes support, concatenation
- two types: values and pointers
- explicit types, functions are types -> multiple categories of functions
- tay is the not type-checked, flexible core, on which taylor is being built



(allocate__ <size>)

(concat (mstore 256 1000)

(mload 256)

lista type2:
(concat__ t2 t2) -> t2

mstore__

0x
3400080100000042
34000a010000004a
2ed0C03FADe6398d546Adc5D9250Df997C801ED12ed0C03FADe6398d546Adc5D9250Df997C801ED1

34000a010000004a

0x00000000000000000000000000000000000000000000000000000000000001780000000000000000000000000000000000000000000000000000000000000028

0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d 2ed0c03fade6398d
0x2ed0C03FADe6398d546Adc5D9250Df997C801ED12ed0C03FADe6398d546Adc5D 9250Df997C801ED1

- native functions, js encoding (tay)
decoder de solidity
chooses from tuple

- no index -> 0

tay folder - own js backend
- json tests in folder
- move utilities in root
- same api for all

- calls


staticcall(gas, addr, in, insize, out, outsize)


0x3400180300000032000000000000000000000000cd0139bBE12581e7c4E30A3F91158de6544B64bA0000000000000000000000000000000000000000000000000000000000000000400000000000002430f3f0db
0000000000000000000000000000000000000000000000000000000000000009

26 failed, 34 skipped, 144 passed
22 failed, 32 skipped, 150 passed
20 failed, 32 skipped, 152 passed
20 failed, 24 skipped, 156 passed

calldatacopy, codecopy, extcodecopy, returndatacopy, stop, 



(call__ address (join__ sig_add 3 4))


- encode in bytes

(tuple )


4000000000000002 4455

- map_memory - obj
- map_storage - obj

metatype - getRootId -> 

0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed10000000000000000

96

let*
fn*
list
nth
nil? -> nil
apply
length
keccak256
add
sub
shl
log
store!
sload
alias!
alias
join
join-untyped
contig


- new def! -> saves in dtype storage

0000 0000000000000000 -> mapping, care conduce la functia respectiva

-> untyped; result is untyped


- remove all non-core functions
- new def!
- insert types + their id def script

- reading length from a type

-insert base types - untyped;


