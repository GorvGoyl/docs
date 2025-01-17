/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, {useState, useRef, useEffect} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useLocation} from '@docusaurus/router';
import {isSamePath} from '../../utils';

function NavLink({
  activeBasePath,
  activeBaseRegex,
  to,
  href,
  icon,
  label,
  activeClassName = 'navbar__link--active',
  prependBaseUrlToHref,
  ...props
}) {
  // TODO all this seems hacky
  // {to: 'version'} should probably be forbidden, in favor of {to: '/version'}
  const toUrl = useBaseUrl(to);
  const activeBaseUrl = useBaseUrl(activeBasePath);
  const normalizedHref = useBaseUrl(href, {
    forcePrependBaseUrl: true,
  });
  return (
    <Link
      {...(href
        ? {
            target: href.startsWith('/') ? '_self' : '_blank',
            rel: 'noopener noreferrer',
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            isNavLink: true,
            activeClassName,
            to: toUrl,
            ...(activeBasePath || activeBaseRegex
              ? {
                  isActive: (_match, location) =>
                    activeBaseRegex
                      ? new RegExp(activeBaseRegex).test(location.pathname)
                      : location.pathname.startsWith(activeBaseUrl),
                }
              : null),
          })}
      {...props}>
      <span>
      {icon ? <img className="navbar-icon" src={icon}/> : ""}
      {label}
      </span>
    </Link>
  );
}

function NavItemDesktop({items, position, className, ...props}) {
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }

      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownRef]);

  const navLinkClassNames = (extraClassName, isDropdownItem = false) =>
    clsx(
      {
        'navbar__item navbar__link': !isDropdownItem,
        dropdown__link: isDropdownItem,
      },
      extraClassName,
    );

  if (!items) {
    return <NavLink className={navLinkClassNames(className)} {...props} />;
  }

  return (
    <div
      ref={dropdownRef}
      className={clsx('navbar__item', 'dropdown', 'dropdown--hoverable', {
        'dropdown--left': position === 'left',
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}>
      <NavLink
        className={navLinkClassNames(className)}
        {...props}
        onClick={props.to ? undefined : (e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}>
        {props.label}
      </NavLink>
      <ul ref={dropdownMenuRef} className="dropdown__menu">
        {items.map(({className: childItemClassName, ...childItemProps}, i) => (
          <li key={i}>
            <NavLink
              onKeyDown={(e) => {
                if (i === items.length - 1 && e.key === 'Tab') {
                  e.preventDefault();
                  setShowDropdown(false);
                  const nextNavbarItem = dropdownRef.current.nextElementSibling;

                  if (nextNavbarItem) {
                    nextNavbarItem.focus();
                  }
                }
              }}
              activeClassName="dropdown__link--active"
              className={navLinkClassNames(childItemClassName, true)}
              {...childItemProps}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItemMobile({
  items,
  className,
  position: _position,
  // Need to destructure position from props so that it doesn't get passed on.
  ...props
}) {
  const {pathname} = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => !items?.some((item) => isSamePath(item.to, pathname)) ?? true,
  );

  const navLinkClassNames = (extraClassName, isSubList = false) =>
    clsx(
      'menu__link',
      {
        'menu__link--sublist': isSubList,
      },
      extraClassName,
    );

  if (!items) {
    return (
      <li className="menu__list-item">
        <NavLink className={navLinkClassNames(className)} {...props} />
      </li>
    );
  }

  return (
    <li
      className={clsx('menu__list-item', {
        'menu__list-item--collapsed': collapsed,
      })}>
      <NavLink
        role="button"
        className={navLinkClassNames(className, true)}
        {...props}
        onClick={() => {
          setCollapsed((state) => !state);
        }}>
        {props.label}
      </NavLink>
      <ul className="menu__list">
        {items.map(({className: childItemClassName, ...childItemProps}, i) => (
          <li className="menu__list-item" key={i}>
            <NavLink
              activeClassName="menu__link--active"
              className={navLinkClassNames(childItemClassName)}
              {...childItemProps}
              onClick={props.onClick}
            />
          </li>
        ))}
      </ul>
    </li>
  );
}

function DefaultNavbarItem({mobile = false, ...props}) {
  const Comp = mobile ? NavItemMobile : NavItemDesktop;
  return <Comp {...props} />;
}

export default DefaultNavbarItem;
