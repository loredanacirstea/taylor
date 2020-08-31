pragma solidity 0.7.0;


/// @title Vendor Registration contract. This is where vendors are registered in the system.
/// @notice This is where vendors are registered in the system.
contract VendorRegistration {

    mapping (uint256 => address[]) public table;

    event VendorRegistered(uint256 product_id, address vendor);

    constructor() public {
        registerVendor(msg.sender, 1);
    }

    /// @notice This function returns an available vendor for a given product
    /// @param product_id The id of the product registered in the system.
    /// @return vendor The Ethereum address of the vendor.
    function getVendor(uint256 product_id) view public returns (address vendor) {
        if (table[product_id].length == 0) {
            return address(0x0);
        }
        return table[product_id][0];
    }

    /// @notice This function registers a vendor in the system, for the given product.
    /// @param vendor The Ethereum address of the vendor.
    /// @param product_id The id of the product registered in the system.
    function registerVendor(address vendor, uint256 product_id) public {
        if (table[product_id].length == 0) {
            table[product_id] = new address[](0);
        }
        table[product_id].push(vendor);
        emit VendorRegistered(product_id, vendor);
    }
}
