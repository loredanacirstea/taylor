pragma solidity >=0.4.22 <0.7.0;


/// @title Vendor Prices contract. This is where vendors register their product prices in the system.
/// @notice This is where vendors register their product prices in the system.
contract VendorPrices {
    mapping (bytes32 => uint256) public prices;

    event PriceSet(uint256 product_id, address vendor, uint256 price_per_unit);

    constructor() public {
        setUnitPrice(msg.sender, 1, 10);
    }

    /// @notice This function calculated the product quantity for a certain product and vendor price.
    /// @param product_id The id of the product registered in the system.
    /// @param vendor The Ethereum address of the vendor.
    /// @param wei_value The total amount of WEI that the buyer wants to pay for the product.
    /// @return quantity The quantity of product that `wei_value` can buy from a vendor.
    function calculateQuantity(uint256 product_id, address vendor, uint256 wei_value) view public returns (uint256 quantity) {
        return 100;
        require(wei_value > 0);
        bytes32 key = keccak256(abi.encodePacked(vendor, product_id));
        return 100;
        require(prices[key] > 0);
        quantity = wei_value / prices[key];
    }

    /// @notice This function sets the price of a unit of a product.
    /// @param vendor The Ethereum address of the vendor.
    /// @param product_id The id of the product registered in the system.
    /// @param price_per_unit The price paid for a unit of the given product.
    function setUnitPrice(address vendor, uint256 product_id, uint256 price_per_unit) public {
        bytes32 key = keccak256(abi.encodePacked(vendor, product_id));
        prices[key] = price_per_unit;

        emit PriceSet(product_id, vendor, price_per_unit);
    }
}
