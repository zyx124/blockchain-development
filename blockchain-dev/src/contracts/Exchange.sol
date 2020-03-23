pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Token.sol";

// TODO:
// [X] Set the fee account
// [X] Deposit Ether
// [X] Deposit tokens
// [] 

contract Exchange {
    using SafeMath for uint;

    // Variables
    address public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0); // store ether in tokens mapping with blank address
    mapping(address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint balance);

    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }


    // Fallback: revert if ether is sent to this smart constract.
    function() external {
        revert("ether is sent to Exchange constract");
    }

    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount, "not sufficient amount");
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint _amount) public {
        require(_token != ETHER, "Ether address is equal to Token");
        require(Token(_token).transferFrom(msg.sender, address(this), _amount), "tokens not transfered");
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER, "token address identical to Ether!");
        require(tokens[_token][msg.sender] >= _amount, "not enough balance");
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount), "token is not transfered back to the user");
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }
}