const functions = {
    slicea: `(def! slicea (fn* (somearr start stop)
    (map (fn* (pos) (nth somearr pos)) (range start stop 1))
))`,
    
    slicemultia: `(def! slicemultia (fn* (somearr rangeIndexList)
    (let* (
            nextRange (first rangeIndexList)
            restRange (rest rangeIndexList)
        )
        (if (empty? restRange)
            (slicemultia somearr nextRange)
            (if (sequential? nextRange)
                (map
                    (fn* (arr) (slicemultia arr restRange))
                    (slicemultia somearr nextRange )
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
    
    new_array: `(def! new-array (fn* (func elemList rangesArray)
    (if (empty? rangesArray)
        (apply func elemList)
        (let* (
                currentRange (first rangesArray)
                restRanges (rest rangesArray)
            )
            (map
                (fn* (index) (new-array func (push elemList index) restRanges) )
                (range (nth currentRange 0) (nth currentRange 1) 1)
            )
        )
    )
))`,

    diagonal_fill: `(def! diagonal-fill (fn* (listIndexes)
        (if (eq (nth listIndexes 0) (nth listIndexes 1))
            (if (eq (length listIndexes) 2)
                1
                (diagonal-fill (rest listIndexes))
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
            lengthRanges (map (fn* (len) (array 0 (sub len 1))) (inverse (lengths matrix)))
            fillfunc (fn* (origMatrix)
                (fn* (indexList)
                    (pick origMatrix (inverse indexList))
                )
            )
            fillfunc2 (fillfunc matrix)
        )
        (new-array fillfunc2 (array) lengthRanges)
        ; (new-array (fillfunc matrix) (array) lengthRanges)
    )
))`,

    excludeMatrix: `(def! excludeMatrix (fn* (matrix x y)
    (let* (
            lengthRanges (map
                    (fn* (len)
                        (array 0 (sub len 2))
                    ) 
                    (lengths matrix)
                )
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
            fillfunc2 (fillfunc matrix)
        )
        (new-array fillfunc2 (array) lengthRanges)
    )
))`,
}

module.exports = functions;
