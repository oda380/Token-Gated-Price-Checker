// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessCard is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    /// @notice URI applied to new mints unless overridden
    string public defaultTokenURI;

    /// @notice Optional collection-level metadata (marketplace collection page)
    string public contractLevelURI;

    event DefaultTokenURIUpdated(string newURI);
    event ContractURIUpdated(string newURI);
    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor(string memory initialDefaultURI, string memory initialContractURI)
        ERC721("Access Card", "CARD")
        Ownable(msg.sender)
    {
        defaultTokenURI = initialDefaultURI;     // e.g. ipfs://CID/metadata.json
        contractLevelURI = initialContractURI;   // e.g. ipfs://CID/collection.json (optional)
    }

    // -------------------------
    // Admin configuration
    // -------------------------

    /// @notice Update the default URI used for future mints
    function setDefaultTokenURI(string calldata newURI) external onlyOwner {
        defaultTokenURI = newURI;
        emit DefaultTokenURIUpdated(newURI);
    }

    /// @notice Update collection-level metadata URI (used by marketplaces)
    function setContractURI(string calldata newURI) external onlyOwner {
        contractLevelURI = newURI;
        emit ContractURIUpdated(newURI);
    }

    /// @notice Marketplace hook for collection metadata
    function contractURI() external view returns (string memory) {
        return contractLevelURI;
    }

    /// @notice Set/replace URI for an existing token
    function setTokenURI(uint256 tokenId, string calldata newURI) external onlyOwner {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, newURI);
    }

    // -------------------------
    // Minting
    // -------------------------

    /// @notice Mint one card using the current defaultTokenURI
    function mint(address to) external onlyOwner {
        uint256 id = _nextTokenId++;
        _safeMint(to, id);
        _setTokenURI(id, defaultTokenURI);
        emit Minted(to, id, defaultTokenURI);
    }

    /// @notice Mint one card with a custom URI (overrides default for this token)
    function mintWithURI(address to, string calldata uri) external onlyOwner {
        uint256 id = _nextTokenId++;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        emit Minted(to, id, uri);
    }

    /// @notice Bulk mint: one token per recipient using current defaultTokenURI
    function mintBatch(address[] calldata recipients) external onlyOwner {
        uint256 id = _nextTokenId;
        for (uint256 i = 0; i < recipients.length; i++) {
            _safeMint(recipients[i], id);
            _setTokenURI(id, defaultTokenURI);
            emit Minted(recipients[i], id, defaultTokenURI);
            id++;
        }
        _nextTokenId = id;
    }

    // balanceOf(address) and ownerOf(uint256) are inherited unchanged (match your ABI)
}
