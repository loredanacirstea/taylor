const functions = {
    slicea: `(def! slicea (fn* (somearr start stop)
    (map (fn* (pos) (nth somearr pos)) (range start stop 1))
))`,
    
    nslice: `(def! nslice (fn* (somearr rangeIndexList)
    (let* (
            nextRange (first rangeIndexList)
            restRange (rest rangeIndexList)
        )
        (if (empty? restRange)
            (nslice somearr nextRange)
            (if (sequential? nextRange)
                (map
                    (fn* (arr) (nslice arr restRange))
                    (nslice somearr nextRange )
                )
                (slicea somearr (nth rangeIndexList 0) (nth rangeIndexList 1) )
            )
        )
    )    
))`,
    
    reduce2: '(def! reduce2 (fn* (f xs init) (if (empty? xs) init (reduce2 f (rest xs) (f init (first xs)) ))))',
    
    fibonacci: '(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(fibonacci (sub n 1)) (fibonacci (sub n 2)) ) )))',
    
    bytesToArray: `(def! bytesToArray (fn* (bval slotLen offset accum)
    (if (lt (length bval) slotLen)
        accum
        (let* (
                sliced (slice bval (add slotLen offset))
                newaccum (push accum (nth sliced 0))
            )
            (bytesToArray (nth sliced 1) slotLen 0 newaccum)
        )
    )
))`,

    arrayToBytes: `(def! arrayToBytes (fn* (somearray)
    (reduce join somearray "0x")
))`,

    new_array: `(def! new-array (fn* (func lengthsList)
    (let* (
            limits (fn* (len) (array 0 (sub len 1)) )
            _new-array (fn* (func elemList rangesArray)
                (if (empty? rangesArray)
                    (apply func elemList)
                    (let* (
                            currentRange (first rangesArray)
                            restRanges (rest rangesArray)
                        )
                        (map
                            (fn* (index) (_new-array func (push elemList index) restRanges) )
                            (range (nth currentRange 0) (nth currentRange 1) 1)
                        )
                    )
                )
            )
        )
        (_new-array
            func
            (array)
            (map limits lengthsList)
        )
    )
))`,

    same_q: `(def! same? (fn* (listIndexes)
        (if (eq (nth listIndexes 0) (nth listIndexes 1))
            (if (eq (length listIndexes) 2)
                1
                (same? (rest listIndexes))
            )
            0
        )
    ))`,

    pick: `(def! pick (fn* (somearr indexList)
    (let* (
            selection (nth somearr (first indexList))
            indexes (rest indexList)
        )
        (if (empty? indexes)
            selection
            (pick selection indexes)
        )
    )
))`,
    
    pop: `(def! pop (fn* (somearr)
    (nth somearr (sub (length somearr) 1))
))`,
    
    inverse: `(def! inverse (fn* (somearr)
    (if (eq (length somearr) 0)
        (array)
        (push
            (inverse (rest somearr))
            (first somearr)
        )
    )
))`,

    lengths: `(def! lengths (fn* (multia)
    (if (array? multia)
        (shift
            (lengths (first multia))
            (length multia)
        )
        (array)
    )
))`,

    transpose: `(def! transpose (fn* (matrix)
    (let* (
            matrixLengths (inverse (lengths matrix))
            fillfunc (fn* (origMatrix)
                (fn* (indexList)
                    (pick origMatrix (inverse indexList))
                )
            )
            fillfunc2 (fillfunc matrix)
        )
        (new-array fillfunc2 matrixLengths)
        ; (new-array (fillfunc matrix) matrixLengths)
    )
))`,

    excludeMatrix: `(def! excludeMatrix (fn* (matrix x y)
    (let* (
            sub1 (fn* (a) (sub a 1))
            lengthRanges (map sub1 (lengths matrix))
            fillfunc (fn* (origMatrix)
                (fn* (indexList)
                    (let* (
                            xx (nth indexList 0) 
                            yy (nth indexList 1)
                            newlist1 (if (or (gt xx x) (eq xx x))
                                (push (array) (add xx 1))
                                (push (array) xx)
                            )
                            newlist2 (if (or (gt yy y) (eq yy y))
                                (push newlist1 (add yy 1))
                                (push newlist1 yy)
                            )
                        )
                        (pick origMatrix newlist2)
                    )
                )
            )
        )
        (new-array (fillfunc matrix) lengthRanges)
    )
))`,

    prod: `(def! prod (fn* (matrix1 matrix2)
    (let* (
            matrixLengths1 (lengths matrix1)
            matrixLengths2 (lengths matrix2)
            midLen (nth matrixLengths1 1)
            matrixLengths3 (list (nth matrixLengths1 0) (nth matrixLengths2 1))
            fillfunc (fn* (m1 m2)
                (fn* (indexList)
                    (reduce
                        add
                        (map
                            (fn* (midx)
                                (mul 
                                    (pick m1 (list (nth indexList 0) midx)) (pick m2 (list midx (nth indexList 1))) 
                                )
                            )
                            (range 0 midLen 1)
                        )
                        0
                    )
                )
            )
            fillfunc2 (fillfunc matrix1 matrix2)
        )
        (if (eq midLen (nth matrixLengths2 0))
            (new-array fillfunc2 matrixLengths3)
            (revert "No common dimension")
        )
    )
))`,

    pow_m: `(def! pow-m (fn* (num)
    (if (eq (mod num 2) 0) 1 -1)
))`,

det: `(def! det (fn* (multia)
    (let* (
            alengths (lengths multia)
        )
        (if (same? alengths)
            (if (eq (length alengths) 1)
                (nth multia 0)
                (if (and (eq (nth alengths 0) 1) (same? alengths))
                    (det (nth multia 0))
                    (let* (
                            redf (fn* (ndx)
                                (mul
                                    (mul
                                        (nth (nth multia 0) ndx)
                                        (pow-m ndx)
                                    )
                                    (det (excludeMatrix multia 0 ndx))
                                )
                            )
                        )
                        (reduce
                            add
                            (map
                                redf
                                (range 0 (sub (nth alengths 0) 1) 1)
                            )
                            0
                        )
                    )
                )
            )
            (revert "not square")
        )
    )
))`,

smap: `(def! smap (fn* (func value iterValue)
    (let* (
            resultRange (range 0 (sub (length iterValue) 1) 1)
            wrapper (fn* (_func _value _iterValue)
                (fn* (index)
                    (apply _func _value (nth _iterValue index))
                )
            )
            mappedf (wrapper func value iterValue)
        )
        (map
            mappedf
            resultRange
        )
    )
))`,

smap2: `(def! smap (fn* (func value iterValue)
    (let* (
            wrappedf (fn* (_value _iterValue)
                (fn* (indexList)
                    (apply func _value (pick _iterValue indexList))
                )
            )
        )
        (new-array 
            (wrappedf value iterValue)
            (lengths iterValue)
        )
    )
))`

}

module.exports = functions;
