#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]


#[openbrush::contract]
mod flipper {
    use ink_storage::traits::StorageLayout;
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    use openbrush::{storage::Mapping, traits::Storage};
    use ink_prelude::{vec,vec::Vec};

    #[derive(
        Debug, PartialEq, Eq, scale::Encode, scale::Decode, Clone, SpreadLayout, PackedLayout,
    )]
    #[cfg_attr(feature = "std", derive(StorageLayout, scale_info::TypeInfo))]
    pub enum TokenType {
        GovernanceToken,
        Psp22,
        Psp34,
    }

    #[derive(Debug, Clone, scale::Encode, scale::Decode, SpreadLayout, PackedLayout, PartialEq)]
    #[cfg_attr(feature = "std", derive(StorageLayout, scale_info::TypeInfo))]
    pub struct TokenInfo {
        token_type: TokenType,
        token_address: AccountId,
    }
    
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single `bool` value on the storage.
        value: bool,
        token_list_for_id: Mapping<u128, TokenInfo>,
        next_id:u128,
    }

    impl Flipper {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value, token_list_for_id:Mapping::default(), next_id:0, }
        }

        /// Constructor that initializes the `bool` value to `false`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored `bool` from `true`
        /// to `false` and vice versa.
        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        /// Simply returns the current value of our `bool`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }

        #[ink(message)]
        pub fn add_test_data(&mut self, account_id:AccountId, token_type:u8) {

            self.token_list_for_id.insert(&self.next_id, &TokenInfo{token_address:account_id,token_type:TokenType::GovernanceToken});
            self.next_id = self.next_id + 1;
        }


        #[ink(message)]
        pub fn get_test_list(&self, test_param:u128) -> Vec<TokenInfo> {
            let mut result:Vec<TokenInfo> = Vec::new();
            for  i in 0..self.next_id {
                match self.token_list_for_id.get(&i) {
                    Some(value) => result.push(value.clone()),
                    None => (),
                }
            }
            result
        }

    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// Imports `ink_lang` so we can use `#[ink::test]`.
        use ink_lang as ink;

        /// We test if the default constructor does its job.
        #[ink::test]
        fn default_works() {
            let flipper = Flipper::default();
            assert_eq!(flipper.get(), false);
        }

        /// We test a simple use case of our contract.
        #[ink::test]
        fn it_works() {
            let mut flipper = Flipper::new(false);
            assert_eq!(flipper.get(), false);
            flipper.flip();
            assert_eq!(flipper.get(), true);
        }
    }
}
