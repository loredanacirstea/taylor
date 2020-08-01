const WETH_EXAMPLE = {
    addresses: {
        3: {
            address: '0xbCA556c912754Bc8E7D4Aad20Ad69a1B1444F42d',
            users: [
                '0x42b4dd5dfdd744e9bff2be9c88eb4b7d58f62865',
                '0x161302713a38691fd4e6850fae35097a7140ac52',
                '0xed501b6f8359007df42cc9a5179e7cef63461001',
                '0xfc638dd76fde4c16a96f79c3ad669fe30060bbdf',
                '0x5099a31f9a4105bfaa89b4cb78ef0a372ec915c7',
            ],
        },
        4: {
            address: '0x1b45d86492d098b10fdbf382c537359f776f8dad',
            users: [
                '0x11401c3a05746d782ece7f4c031d4c2a19621c2e',
                '0x5d3341894de128cf9538081e44aca999588a7b1f',
                '0xe6999b3d8c331dc9fd807df67011365a2b29e4c8',
                '0x5b9760d74ce09cc5f58184d7089a4ac37c11f784',
            ],
        },
        5: {
            address: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
            users: [
                '0x02d7a5885335dea6a6664ad7154762c55557b157',
                '0x8cb4ba26c491a6176bba3a2af22076e15f96c649',
                '0x10e992eb3edecfbe31541d70b437c9b349701a0d',
                '0xf54e502f97e659569361571ff89f3848151a3450',
                '0xc73e8cc634c20dc01c65ddf81b363f7eb809b64d',
            ],
        },
        42: {
            address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
            users: [
                '0x0a23f75e30eccee0f0c6fc78bbef3593fd426bbf',
                '0x9e42983bd6bebf08d9a823ceb40b01cb6bc9c608',
                '0x685fad8f4e19ee42e0d3c47b0d05ace747fb8707',
                '0x72aa5ad78fb4f2e567a5df833dad12f60b52db63',
                '0xdae0aca4b9b38199408ffab32562bf7b3b0495fe',
            ],
        },
    },
    fsigs: {
        balance: 'balanceOf(address)->(uint)',
    }
}

const PIPE_EXAMPLE = {
    addresses: {
        3: {
            vr: {
                address: '0x274782b8155ddcc9d868f9e676e6688d78c22488',
            },
            vp: {
                address: '0x7a93134e763a75df41b625319839024e628ce171',
            },
            mp: {
                address: '0x0b77f47455f3e39c817f1b4d29b81461105438c0',
            },
        },
        4: {
            vr: {
                address: '0x5Ba5AF7069E80CCDE94FB447dBbdE0e7389Ef605',
            },
            vp: {
                address: '0x4FefBfE56587f4a2A12781D42dD02208881DeC2F',
            },
            mp: {
                address: '0xf072b131ae4bed7b83217d76ba2c636c20997340',
            },
        },
        5: {
            vr: {
                address: '0xF384A3DE0A6FD5610300E7d12355E51fed35477c',
            },
            vp: {
                address: '0xB2329Af26602a2902132259881Ab55cFb3f6aa2E',
            },
            mp: {
                address: '0x54CC32549a5bEF608596b09fC0079A7D5Caf0329',
            },
        },
        42: {
            vr: {
                address: '0x87140D2DD09e0f6E7461b5F6a8B2D6084f4b7a5F',
            },
            vp: {
                address: '0x87140D2DD09e0f6E7461b5F6a8B2D6084f4b7a5F',
            },
            mp: {
                address: '0x87140D2DD09e0f6E7461b5F6a8B2D6084f4b7a5F',
            },
        }
    }
}

module.exports = {
    WETH_EXAMPLE,
    PIPE_EXAMPLE,
}
