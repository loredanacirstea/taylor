const functions = {
//     slicea: `(def! slicea (fn* (somearr start stop)
//     (map (fn* (pos) (nth somearr pos)) (range start stop 1))
// ))`,
    
//     nslice: `(def! nslice (fn* (somearr rangeIndexList)
//     (let* (
//             nextRange (first rangeIndexList)
//             restRange (rest rangeIndexList)
//         )
//         (if (empty? restRange)
//             (nslice somearr nextRange)
//             (if (sequential? nextRange)
//                 (map
//                     (fn* (arr) (nslice arr restRange))
//                     (nslice somearr nextRange )
//                 )
//                 (slicea somearr (nth rangeIndexList 0) (nth rangeIndexList 1) )
//             )
//         )
//     )    
// ))`,
    
//     reduce2: '(def! reduce2 (fn* (f xs init) (if (empty? xs) init (reduce2 f (rest xs) (f init (first xs)) ))))',
    
//     fibonacci: '(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(fibonacci (sub n 1)) (fibonacci (sub n 2)) ) )))',
    
//     bytesToArray: `(def! bytesToArray (fn* (bval slotLen offset accum)
//     (if (lt (length bval) slotLen)
//         accum
//         (let* (
//                 sliced (slice bval (add slotLen offset))
//                 newaccum (push accum (nth sliced 0))
//             )
//             (bytesToArray (nth sliced 1) slotLen 0 newaccum)
//         )
//     )
// ))`,

//     arrayToBytes: `(def! arrayToBytes (fn* (somearray)
//     (reduce join somearray "0x")
// ))`,

//     new_array: `(def! new-array (fn* (func lengthsList)
//     (let* (
//             limits (fn* (len) (array 0 (sub len 1)) )
//             _new-array (fn* (func elemList rangesArray)
//                 (if (empty? rangesArray)
//                     (apply func elemList)
//                     (let* (
//                             currentRange (first rangesArray)
//                             restRanges (rest rangesArray)
//                         )
//                         (map
//                             (fn* (index) (_new-array func (push elemList index) restRanges) )
//                             (range (nth currentRange 0) (nth currentRange 1) 1)
//                         )
//                     )
//                 )
//             )
//         )
//         (_new-array
//             func
//             (array)
//             (map limits lengthsList)
//         )
//     )
// ))`,

//     same_q: `(def! same? (fn* (listIndexes)
//         (if (eq (nth listIndexes 0) (nth listIndexes 1))
//             (if (eq (length listIndexes) 2)
//                 1
//                 (same? (rest listIndexes))
//             )
//             0
//         )
//     ))`,

//     pick: `(def! pick (fn* (somearr indexList)
//     (let* (
//             selection (nth somearr (first indexList))
//             indexes (rest indexList)
//         )
//         (if (empty? indexes)
//             selection
//             (pick selection indexes)
//         )
//     )
// ))`,
    
//     pop: `(def! pop (fn* (somearr)
//     (nth somearr (sub (length somearr) 1))
// ))`,
    
//     inverse: `(def! inverse (fn* (somearr)
//     (if (eq (length somearr) 0)
//         (array)
//         (push
//             (inverse (rest somearr))
//             (first somearr)
//         )
//     )
// ))`,

//     lengths: `(def! lengths (fn* (multia)
//     (if (array? multia)
//         (shift
//             (lengths (first multia))
//             (length multia)
//         )
//         (array)
//     )
// ))`,

//     transpose: `(def! transpose (fn* (matrix)
//     (let* (
//             matrixLengths (inverse (lengths matrix))
//             fillfunc (fn* (origMatrix)
//                 (fn* (indexList)
//                     (pick origMatrix (inverse indexList))
//                 )
//             )
//         )
//         (new-array (fillfunc matrix) matrixLengths)
//     )
// ))`,

//     excludeMatrix: `(def! excludeMatrix (fn* (matrix x y)
//     (let* (
//             sub1 (fn* (a) (sub a 1))
//             lengthRanges (map sub1 (lengths matrix))
//             fillfunc (fn* (origMatrix)
//                 (fn* (indexList)
//                     (let* (
//                             xx (nth indexList 0) 
//                             yy (nth indexList 1)
//                             newlist1 (if (or (gt xx x) (eq xx x))
//                                 (push (array) (add xx 1))
//                                 (push (array) xx)
//                             )
//                             newlist2 (if (or (gt yy y) (eq yy y))
//                                 (push newlist1 (add yy 1))
//                                 (push newlist1 yy)
//                             )
//                         )
//                         (pick origMatrix newlist2)
//                     )
//                 )
//             )
//         )
//         (new-array (fillfunc matrix) lengthRanges)
//     )
// ))`,

//     prod: `(def! prod (fn* (matrix1 matrix2)
//     (let* (
//             matrixLengths1 (lengths matrix1)
//             matrixLengths2 (lengths matrix2)
//             midLen (nth matrixLengths1 1)
//             matrixLengths3 (list (nth matrixLengths1 0) (nth matrixLengths2 1))
//             fillfunc (fn* (m1 m2)
//                 (fn* (indexList)
//                     (reduce
//                         add
//                         (map
//                             (fn* (midx)
//                                 (mul 
//                                     (pick m1 (list (nth indexList 0) midx)) (pick m2 (list midx (nth indexList 1))) 
//                                 )
//                             )
//                             (range 0 midLen 1)
//                         )
//                         0
//                     )
//                 )
//             )
//             fillfunc2 (fillfunc matrix1 matrix2)
//         )
//         (if (eq midLen (nth matrixLengths2 0))
//             (new-array fillfunc2 matrixLengths3)
//             (revert "No common dimension")
//         )
//     )
// ))`,

//     pow_m: `(def! pow-m (fn* (num)
//     (if (eq (mod num 2) 0) 1 -1)
// ))`,

// det: `(def! det (fn* (multia)
//     (let* (
//             alengths (lengths multia)
//         )
//         (if (same? alengths)
//             (if (eq (length alengths) 1)
//                 (nth multia 0)
//                 (if (and (eq (nth alengths 0) 1) (same? alengths))
//                     (det (nth multia 0))
//                     (let* (
//                             redf (fn* (ndx)
//                                 (mul
//                                     (mul
//                                         (nth (nth multia 0) ndx)
//                                         (pow-m ndx)
//                                     )
//                                     (det (excludeMatrix multia 0 ndx))
//                                 )
//                             )
//                         )
//                         (reduce
//                             add
//                             (map
//                                 redf
//                                 (range 0 (sub (nth alengths 0) 1) 1)
//                             )
//                             0
//                         )
//                     )
//                 )
//             )
//             (revert "not square")
//         )
//     )
// ))`,

// smap: `(def! smap (fn* (func value iterValue)
//     (let* (
//             resultRange (range 0 (sub (length iterValue) 1) 1)
//             wrapper (fn* (_func _value _iterValue)
//                 (fn* (index)
//                     (apply _func _value (nth _iterValue index))
//                 )
//             )
//             mappedf (wrapper func value iterValue)
//         )
//         (map
//             mappedf
//             resultRange
//         )
//     )
// ))`,

// smap2: `(def! smap (fn* (func value iterValue)
//     (let* (
//             wrappedf (fn* (_value _iterValue)
//                 (fn* (indexList)
//                     (apply func _value (pick _iterValue indexList))
//                 )
//             )
//         )
//         (new-array 
//             (wrappedf value iterValue)
//             (lengths iterValue)
//         )
//     )
// ))`,

// 'nth-eth-arg': `
// (def! nth-eth-arg (fn* (bvalue index argHasSlotSizeArray)
// (let* (
//         nextDynamicOffset (fn* (encodedb _hasSlotSizeArray _index)
//             (if (lt _index (length _hasSlotSizeArray) )
//                 (let* (
//                         _hasSlotS (nth _hasSlotSizeArray _index)
//                         fragment (nth (slice encodedb (mul _index 32)) 1)
//                     )
//                     (if _hasSlotS
//                         (nextDynamicOffset encodedb _hasSlotSizeArray (add _index 1))
//                         (first (slice fragment 32) )
//                     )
//                 )
//                 (length encodedb)
//             )
//         )
//         hasSlotSize (nth argHasSlotSizeArray index)
//         fragments (slice bvalue (mul index 32))
//         offsetOrArg (nth (slice (nth fragments 1) 32) 0)
//     )
//     (if hasSlotSize
//         offsetOrArg
//         (let* (
//                 offset (to-uint offsetOrArg)
//                 values (nth (slice bvalue offset) 1)
//             )
//             (first (slice 
//                 values 
//                 (sub 
//                     (to-uint (nextDynamicOffset bvalue argHasSlotSizeArray (add index 1)))
//                     offset
//                 )
//             ))
//         )
//     )
// )
// ))`,

// 'eth-pipe-evm': `
// (def! eth-pipe-evm (fn* (input steps outputIndexes)
// (let* (
//         selectIO (fn* (ioList) (fn* (index) (nth ioList index) ))
//     )
//     (if (empty? steps)
//         (map (selectIO input) outputIndexes)
//         (let* (
//                 toList (fn* (encoded hasSlotArr)
//                     (if (empty? hasSlotArr) 
//                         (list)
//                         (let* (
//                                 wrappedNthArg (fn* (_encoded _hasSlotArr)
//                                     (fn* (_index)
//                                         (nth-eth-arg _encoded _index _hasSlotArr)
//                                     )
//                                 )
//                             )
//                             (map (wrappedNthArg encoded hasSlotArr) (range 0 (sub (length hasSlotArr) 1) 1))
//                         )
//                     )
//                 )
//                 currentStep (first steps)
//             )
//             (eth-pipe-evm 
//                 (concat
//                     input
//                     (toList
//                         (call
//                             (nth currentStep 0)
//                             (nth currentStep 1)
//                             (arrayToBytes (map (selectIO input) (nth currentStep 2) ))
//                         )
//                         (nth currentStep 3)
//                     )
//                 )
//                 (rest steps)
//                 outputIndexes
//             )
//         )
//     )
// )
// ))`,

// 'eth-pipe-evm!': `
// (def! eth-pipe-evm! (fn* (input steps outputIndexes)
// (let* (
//         selectIO (fn* (ioList) (fn* (index) (nth ioList index) ))
//     )
//     (if (empty? steps)
//         (map (selectIO input) outputIndexes)
//         (let* (
//                 toList (fn* (encoded hasSlotArr)
//                     (if (empty? hasSlotArr) 
//                         (list)
//                         (let* (
//                                 wrappedNthArg (fn* (_encoded _hasSlotArr)
//                                     (fn* (_index)
//                                         (nth-eth-arg _encoded _index _hasSlotArr)
//                                     )
//                                 )
//                             )
//                             (map (wrappedNthArg encoded hasSlotArr) (range 0 (sub (length hasSlotArr) 1) 1))
//                         )
//                     )
//                 )
//                 currentStep (first steps)
//                 valueIndex (nth currentStep 2)
//             )
//             (eth-pipe-evm!
//                 (concat
//                     input
//                     (toList
//                         (call!
//                             (nth currentStep 0)
//                             (nth currentStep 1)
//                             (if (nil? valueIndex) 0 (nth input valueIndex))
//                             (arrayToBytes (map (selectIO input) (nth currentStep 3) ))
//                         )
//                         (nth currentStep 4)
//                     )
//                 )
//                 (rest steps)
//                 outputIndexes
//             )
//         )
//     )
// )
// ))`,

'alias!': `(def! alias! (fn* (name value)
    (store! (keccak256 10 name) value)
))`,

'alias': `(def! alias (fn* (name)
    (sload (keccak256 10 name))
))`,

dtype: `(def! dtype (fn* (signature)
    (sload (keccak256 11 signature))
))`,

getTypeIndex: `(def! getTypeIndex (fn* (signature)
    (let* (
            currentIndex (sload (keccak256 12 signature))
        )
        (add 1 (if (nil? currentIndex) 0 currentIndex))
    )
))`,

// 'getF': `(def! getF (fn* (signature) 
//     (nth
//         (sload (keccak256 11 signature))
//         2
//     )
// ))`,

buildSig: `(def! buildSig (fn* (super kidIndex inputs)
    (if (nil? super)
        (list 0 0)
        (let* (
                super_type (dtype super)
                super_type_sigf (nth super_type 5)
                id (buildSig (nth super_type 0) (nth super_type 1) (nth super_type 4))
                sig (add
                    (nth id 0)
                    (shl (nth super_type 3) kidIndex)
                )
            )
            (list
                (if (nil? super_type_sigf)
                    sig
                    (apply super_type_sigf sig inputs)
                )
                (add (nth id 1) (nth super_type 2) )
            )
        )
    )
))`,

// (contig (nth data 1) "0x00") ? bits -> bytes; something other than contig; fill
// formatSig: `(def! formatSig (fn* (data)
//     (join 
//         (nth data 0)
//         (contig (div (sub 64 (nth data 1)) 8) "0x00")
//     )
// ))`,

formatSig: `(def! formatSig (fn* (value)
    (let* (
            bvalue (join "0x" value)
            bvalue_len (length bvalue)
        )
        (join bvalue (contig (sub 8 bvalue_len) "0x00") )
    )
))`,

padleft: `(def! padleft (fn* (value size padding)
    (let* (
            bvalue (join "0x" value)
        )
        (join (contig (sub size (length bvalue)) padding) bvalue )
    )
))`,

'dtype!': `(def! dtype! (fn* (super name idbits idshifts inputs scriptSig scriptExecute)
    (let* (
            salt 11
            ; index (getTypeIndex super)
            id_data (buildSig super (getTypeIndex super) inputs)
            signature (formatSig (nth id_data 0))
        )
        (list
            (alias! name signature)
            (store! (keccak256 salt signature) (list super (getTypeIndex super) idbits idshifts inputs scriptSig scriptExecute))
            (store!
                (keccak256 12 super) 
                (getTypeIndex super)
            )
            ; (log salt signature name)
        )
    )
))`,

//     'dtype!': `(def! dtype! (fn* (super name inputs script)
//     (let* (
//             salt 11
//             signature (if (nil? super)
//                 (apply script name inputs)
//                 (apply (getF super) name inputs)
//                 ;(apply super name inputs )
//             )
//         )
//         (list
//             (alias! name signature)
//             ;(if (eq signature "0x52e51e30")
//                 (store! (keccak256 salt signature) (list super inputs script))
//             ;)
//             ;(store! (keccak256 salt signature) (list super inputs script))
//             ; (log salt signature name)
//         )
//     )
// ))`,
}

module.exports = functions;
